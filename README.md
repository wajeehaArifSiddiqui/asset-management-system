# Asset Management System

A web-based Asset Management System developed using React, Flask, and MySQL to manage warehouse assets efficiently.

## Features

- Dashboard displaying total assets and category-wise statistics.
- Add new assets with a unique Asset ID, category, and image.
- Automatically records asset creation date and time.
- View all registered assets with their images and details.
- Search assets by Asset ID.
- View individual asset details.
- Edit existing asset information.
- Delete assets.
- Responsive design for desktop and mobile devices.
- REST API integration between frontend and backend.

## Technologies Used

**Frontend**
- React.js
- Vite
- CSS
- Recharts

**Backend**
- Python
- Flask
- Flask-CORS
- REST API

**Database**
- MySQL

## Project Structure

```text
asset-management-system/
│
├── Backend/
│   ├── app.py
│   ├── Database.py
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/wajeehaArifSiddiqui/asset-management-system.git
cd asset-management-system
```

### 2. Backend Setup

```bash
cd Backend
python -m venv venv
```

Activate virtual environment on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your MySQL database credentials in the `.env` file according to the variables used in `Database.py`.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run build
```

### 4. Run the Application

From the Backend folder, activate the virtual environment and run:

```bash
python app.py
```

Open your browser:

```text
http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assets` | Retrieve all assets |
| POST | `/api/assets` | Add a new asset |
| GET | `/api/assets/<asset_id>` | Retrieve an individual asset |
| PUT | `/api/assets/<asset_id>` | Update an asset |
| DELETE | `/api/assets/<asset_id>` | Delete an asset |

## Network Access

The application can be accessed by other devices connected to the same local network when the backend server is running and network access is configured.

## Author

**Wajeeha Arif**

