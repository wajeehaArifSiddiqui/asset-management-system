from email.mime import image

from flask import Flask, jsonify, request, send_from_directory
from Database import get_db_connection
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError
import mysql.connector
import os
import uuid
import traceback
import sys

app = Flask(__name__,
    static_folder="../frontend/dist/assets",
    template_folder="../frontend/dist"
    )
CORS(app)#for react connection

@app.route("/")
def serve_react():
    return send_from_directory(
        app.template_folder,
        "index.html"
    )
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
  #this is for maximum length of image
allowed_extension = {'png', 'jpg', 'jpeg', 'webp','jfif'}

@app.route("/")

def home():
    return jsonify({
        "message": "Asset Management API is running!"
    })

def allowed_file(filename):
    return(
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extension
    )
def validate_image(image):

    try:
        img = Image.open(image)
        img.verify()
        return True
    except (UnidentifiedImageError, OSError):
        return False


   
@app.route("/test-db")
def test_db():

    try:
        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "MySQL connected successfully!",
            "tables": [table[0] for table in tables]
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/assets", methods=["POST"])
def create_asset():
    
    connection = None
    cursor = None
    image_path = None

    try:
        asset_id = request.form.get("asset_id")
        asset_category = request.form.get("category")
        image = request.files.get("image")
        if not asset_id or not asset_category or not image:
            return jsonify({"error": "Missing required fields"}), 400

        #for image validation
        if not image.filename:
            return jsonify({"error": "No image file provided"}), 400
        if not allowed_file(image.filename):
            return jsonify({"error": "only jpg, jpeg, png, webp files allowed"}), 400
        
        if not image.mimetype.startswith("image/"):
            return jsonify({"error": "Invalid image type file"}), 400
        if not validate_image(image):
            return jsonify({"error": "Invalid image file"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id FROM assets  WHERE asset_id = %s", (asset_id,)
        )
        exisiting_asset = cursor.fetchone()
        if exisiting_asset:
            return jsonify({"error": "Asset with this ID already exists"}), 400

        original_name = secure_filename(image.filename)
        extension = original_name.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{extension}"

        image_path = os.path.join(
            app.config["UPLOAD_FOLDER"], filename
        )    
        print("Image filename:", image.filename)
        print("Image content type:", image.mimetype)
        print("Image size:", image.content_length)

        image.stream.seek(0)

        image_data = image.read()

        print("Uploaded file size:", len(image_data))

        with open(image_path, "wb") as file:
            file.write(image_data)

        print("Saved file size:", os.path.getsize(image_path))

        cursor.execute(
            """
            INSERT INTO assets
            (asset_id, category, image_path)
            VALUES (%s, %s, %s)
            """,
            (asset_id, asset_category, filename)
        )
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Asset created successfully",
            "data": {
                "id": cursor.lastrowid,
                "asset_id": asset_id,
                "category": asset_category,
                "image_path": filename
            }
        }), 201
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({
            "status": "error",
            "message": f"MySQL Error: {str(e)}"
        }), 500
    except Exception as e:
        if connection:
            connection.rollback()

        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        traceback.print_exc()
        return jsonify({
        "status": "error",
        "message": f"Error: {str(e)}"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@app.route("/api/assets/<string:asset_id>", methods=["PUT"])
def update_asset(asset_id):

    connection = None
    cursor = None
    image_path = None

    try:
        asset_category = request.form.get("category")
        image = request.files.get("image")

        if not asset_category:
            return jsonify({"error": "Category is required"}), 400

        if image:
            if not image.filename:
                return jsonify({"error": "Invalid image filename"}), 400

            if not allowed_file(image.filename):
                return jsonify({"error": "Only jpg, jpeg, png, webp files allowed"}), 400

            if not image.mimetype.startswith("image/"):
                return jsonify({"error": "Invalid image type"}), 400

            if not validate_image(image):
                return jsonify({"error": "Invalid image file"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM assets WHERE asset_id = %s",
            (asset_id,)
        )

        asset = cursor.fetchone()

        if not asset:
            return jsonify({"error": "Asset not found"}), 404

        old_image = asset["image_path"]

        if image:
            original_name = secure_filename(image.filename)
            extension = original_name.rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{extension}"

            image_path = os.path.join(
                app.config["UPLOAD_FOLDER"], filename
            )

            image.stream.seek(0)
            image_data = image.read()

            with open(image_path, "wb") as file:
                file.write(image_data)

        else:
            filename = old_image

        cursor.execute(
            """
            UPDATE assets
            SET category = %s, image_path = %s
            WHERE asset_id = %s
            """,
            (asset_category, filename, asset_id)
        )

        connection.commit()

        # Remove old image only after successful database update
        if image and old_image:
            old_image_path = os.path.join(
                app.config["UPLOAD_FOLDER"],
                os.path.basename(old_image)
            )

            if os.path.exists(old_image_path):
                os.remove(old_image_path)

        return jsonify({
            "success": True,
            "message": "Asset updated successfully",
            "asset_id": asset_id,
            "category": asset_category,
            "image_path": filename
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()

        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()
            
@app.route("/api/assets", methods=["GET"])
def get_assets():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM assets ORDER BY id DESC")
        assets = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "total_assets": len(assets),
            "assets": assets
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/assets/<string:asset_id>", methods=["GET"])
def get_asset_by_id(asset_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM assets WHERE asset_id = %s",
            (asset_id,)
        )

        asset = cursor.fetchone()

        cursor.close()
        connection.close()

        if not asset:
            return jsonify({
                "error": "Asset not found"
            }), 404

        return jsonify({
            "success": True,
            "asset": asset
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/uploads/<filename>")
def get_uploaded_image(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )
@app.route("/api/assets/<string:asset_id>", methods=["DELETE"])
def delete_asset(asset_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether asset exists
        cursor.execute(
            "SELECT image_path FROM assets WHERE asset_id = %s",
            (asset_id,)
        )
        asset = cursor.fetchone()

        if not asset:
            cursor.close()
            connection.close()
            return jsonify({"error": "Asset not found"}), 404

        # Delete asset from database
        cursor.execute(
            "DELETE FROM assets WHERE asset_id = %s",
            (asset_id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        # Delete uploaded image from folder
        image_path = asset["image_path"]
        if image_path:
            filename = os.path.basename(image_path)
            full_path = os.path.join(
                app.config["UPLOAD_FOLDER"], filename
            )

            if os.path.exists(full_path):
                os.remove(full_path)

        return jsonify({
            "success": True,
            "message": "Asset deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)