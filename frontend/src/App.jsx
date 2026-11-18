
import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './App.css'

function App() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [assetId, setAssetId] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const [searchId, setSearchId] = useState('')
  const [searchedAsset, setSearchedAsset] = useState(null)
  const [searchMessage, setSearchMessage] = useState('')
  const [editAssetId, setEditAssetId] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editImage, setEditImage] = useState(null)
  // Fetch all assets
  const fetchAssets = () => {
    fetch('http://192.168.1.12:5000/api/assets')
      .then(response => response.json())
      .then(data => {
        setAssets(data.assets)
        setLoading(false)
      })
      .catch(error => {
        console.error(error)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  // Add new asset
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('asset_id', assetId)
    formData.append('category', category)
    formData.append('image', image)

    try {
      const response = await fetch(
        'http://192.168.1.12:5000/api/assets',
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()

      if (response.ok) {
        setMessage('Asset added successfully!')

        setAssetId('')
        setCategory('')
        setImage(null)

        e.target.reset()
        fetchAssets()
      } else {
        setMessage(data.error || 'Something went wrong')
      }

    } catch (error) {
      setMessage('Backend connection failed')
    }
  }
  const handleSearch = async (e) => {
  e.preventDefault()

  setSearchedAsset(null)
  setSearchMessage('')

  try {
    const response = await fetch(
      `http://192.168.1.12:5000/api/assets/${encodeURIComponent(searchId)}`
    )

    const data = await response.json()

    if (response.ok) {
      setSearchedAsset(data.asset)
    } else {
      setSearchMessage(data.error || 'Asset not found')
    }
  } catch (error) {
    setSearchMessage('Backend connection failed')
  }
  } 
  const handleDelete = async (assetId) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${assetId}?`
  )

  if (!confirmDelete) return

  try {
    const response = await fetch(
      `http://192.168.1.12:5000/api/assets/${encodeURIComponent(assetId)}`,
      {
        method: 'DELETE'
      }
    )

    const data = await response.json()

    if (response.ok) {
      alert('Asset deleted successfully!')
      fetchAssets()
      setSearchedAsset(null)
      setSearchId('')
    } else {
      alert(data.error || 'Unable to delete asset')
    }
  } catch (error) {
    alert('Backend connection failed')
   }
  } 
  const handleEdit = async (e) => {
  e.preventDefault()

  const formData = new FormData()
  formData.append('category', editCategory)

  if (editImage) {
    formData.append('image', editImage)
  }

  try {
    const response = await fetch(
      `http://192.168.1.12:5000/api/assets/${encodeURIComponent(editAssetId)}`,
      {
        method: 'PUT',
        body: formData
      }
    )

    const data = await response.json()

    if (response.ok) {
      alert('Asset updated successfully!')
      setEditAssetId('')
      setEditCategory('')
      setEditImage(null)
      fetchAssets()
      e.target.reset()
    } else {
      alert(data.error || 'Unable to update asset')
    }
  } catch (error) {
    alert('Backend connection failed')
  }
}
const categoryData = Object.values(
  assets.reduce((result, asset) => {
    const category = asset.category;

    if (!result[category]) {
      result[category] = {
        name: category,
        count: 0
      };
    }

    result[category].count++;

    return result;
  }, {})
);

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A855F7"
];
  return (
    <div className="main-layout">

  <div className="sidebar">

    <h2>Asset Manager</h2>

    <button onClick={() => setActivePage('dashboard')}>
      <span>Dashboard</span>
    </button>

    <button onClick={() => setActivePage('add')}>
      <span>Add Asset</span>
    </button>

    <button onClick={() => setActivePage('search')}>
      <span>Search Asset</span>
    </button>

    <button onClick={() => setActivePage('edit')}>
      <span>Edit Asset</span>
    </button>

    <button onClick={() => setActivePage('delete')}>
      <span>Delete Asset</span>
    </button>

  </div>

  <div className="main-content">

    <h1>Asset Management System</h1>
    <p>Manage and track your company assets.</p>
  {activePage === 'dashboard' && (
  <>
    <div className="dashboard">

  <div className="card total-card">
    <h3>Total Assets</h3>
    <h2>{assets.length}</h2>
  </div>

  <div className="card category-card">
    <h3>Assets by Category</h3>

    <ResponsiveContainer width="110%" height={125}>
      <PieChart>
        <Pie
          data={categoryData}
          dataKey="count"
          nameKey="name"
          cx="40%"
          cy="50%"
          outerRadius={40}
        >
          {categoryData.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend
          layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => {
              const item = categoryData.find(
              (item) => item.name === value
                );

                if (!item || assets.length === 0) {
                  return value;
                }

                const percentage = (
                  (item.count / assets.length) * 100
                ).toFixed(0);

                return `${value} - ${percentage}%`;
            }}
        />
      </PieChart>
    </ResponsiveContainer>

  </div>
</div>
</>
)}
{activePage === 'add' && (
  <>
    <h2>Add New Asset</h2>

      <form onSubmit={handleSubmit} className="asset-form">

        <label>Asset ID</label>
        <input
          type="text"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="Enter Asset ID"
          required
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          <option value="laptop">Laptop</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="printer">Printer</option>
        </select>

        <label>Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />

        <button type="submit">Add Asset</button>

      </form>

      {message && <p>{message}</p>}
        </>
      )}
  {activePage === 'search' && (
  <>
      <h2>Search Asset</h2>

      <form onSubmit={handleSearch} className="asset-form">
        <input
          type="text"
          placeholder="Enter Asset ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          required
        />

      <button type="submit">Search</button>
    </form>

    {searchMessage && <p>{searchMessage}</p>}

    {searchedAsset && (
      <div className="card">
        <img
          src={`http://192.168.1.12:5000/uploads/${searchedAsset.image_path}`}
          alt={searchedAsset.asset_id}
          className="asset-image"
        />

    <h3>{searchedAsset.asset_id}</h3>
    <p>Category: {searchedAsset.category}</p>
    <p>ID: {searchedAsset.id}</p>

      </div>
      
    )}
      </>
)}
{activePage === 'edit' && (
  <>
    <h2>Edit Asset</h2>

  <form onSubmit={handleEdit} className="asset-form">

    <label>Asset ID</label>
    <input
      type="text"
      value={editAssetId}
      onChange={(e) => setEditAssetId(e.target.value)}
      placeholder="Enter Asset ID to edit"
      required
    />

    <label>New Category</label>
    <select
      value={editCategory}
      onChange={(e) => setEditCategory(e.target.value)}
      required
    >
      <option value="">Select Category</option>
      <option value="laptop">Laptop</option>
      <option value="desktop">Desktop</option>
      <option value="mobile">Mobile</option>
      <option value="printer">Printer</option>
    </select>

    <label>New Image (Optional)</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setEditImage(e.target.files[0])}
    />

    <button type="submit">Update Asset</button>
  </form>
    </>
)}

      {activePage === 'dashboard' && (
  <>
    <h2>All Assets</h2>

    {loading ? (
      <p>Loading assets...</p>
    ) : (
      <div className="assets-container">
        {assets.map(asset => (
          <div className="card" key={asset.id}>

            <img
              src={`http://192.168.1.12:5000/uploads/${asset.image_path}`}
              alt={asset.asset_id}
              className="asset-image"
            />

            <h3 style={{ color: "white" }}>{asset.asset_id}</h3>
            <p style={{ color: "white" }}>Category: {asset.category}</p>
            <p style={{ color: "white" }}>ID: {asset.id}</p>

          </div>
        ))}
      </div>
    )}
  </>
)}

{activePage === 'delete' && (
  <>
    <h2>Delete Asset</h2>

    <div className="assets-container">
      {assets.map(asset => (
        <div className="card" key={asset.id}>

          <img
            src={`http://192.168.1.12:5000/uploads/${asset.image_path}`}
            alt={asset.asset_id}
            className="asset-image"
          />

          <h3>{asset.asset_id}</h3>
          <p>Category: {asset.category}</p>

          <button
            onClick={() => handleDelete(asset.asset_id)}
            className="delete-btn"
          >
            Delete
          </button>

        </div>
      ))}
    </div>
  </>
)}

  </div> 
</div>
)
}

export default App