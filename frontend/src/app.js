import React, { useState } from 'react';
import axios from 'axios';
import './app.css';

function App() {
  const [version, setVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [message, setMessage] = useState('');

  const checkUpdate = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/check_update?version=${version}`);
      setUpdateInfo(response.data);
      setMessage('Update info fetched successfully!');
    } catch (error) {
      setMessage('Failed to fetch update info.');
      console.error(error);
    }
  };

  const downloadUpdate = async () => {
    try {
      setDownloadProgress(0);
      const response = await axios({
        method: 'GET',
        url: `http://localhost:5000/api/download_update/${version}`,
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(percentCompleted);
        },
      });

      // Save downloaded file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${version}.zip`);
      document.body.appendChild(link);
      link.click();

      setMessage('Download completed!');
    } catch (error) {
      setMessage('Failed to download update.');
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1>OTA Update Dashboard</h1>

      <div className="input-group">
        <input
          type="text"
          placeholder="Enter Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />
        <button onClick={checkUpdate}>Check Update</button>
      </div>

      {updateInfo && (
        <div className="update-info">
          <h3>Update Details:</h3>
          <p><strong>Version:</strong> {updateInfo.version}</p>
          <p><strong>Description:</strong> {updateInfo.description}</p>
        </div>
      )}

      {updateInfo && (
        <div className="download-section">
          <button onClick={downloadUpdate}>Download Update</button>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${downloadProgress}%` }}>
              {downloadProgress}%
            </div>
          </div>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App;
