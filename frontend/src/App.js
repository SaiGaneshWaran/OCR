import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during upload. Please check the server.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <section className="intro-section">
        <h1>Welcome to Hey™ Payment Verifier</h1>
        <p>Use AI to extract payment details instantly from your receipts using OCR technology.</p>
        <ul className="features">
          <li>📸 Upload any receipt image</li>
          <li>💰 Detect payment amount instantly</li>
          <li>🔍 View extracted raw text</li>
          <li>🚀 Fast and secure backend processing</li>
        </ul>
        <div className="hero-highlight">Empowering smart verifications in 5 seconds.</div>
      </section>

      <section className="upload-section">
        <h2>🧾 Upload Your Receipt Image</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <input type="file" onChange={handleFileChange} accept="image/jpeg, image/png" />
          <button type="submit" disabled={loading || !file}>
            {loading ? <div className="loader"></div> : 'Verify Payment'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </section>

      {result && (
        <div className="result-card">
          {result.success ? (
            <div className="result-success">
              <h2>✅ Verification Success!</h2>
              <p className="amount">Amount Detected: <span>Rs. {result.amount}</span></p>
            </div>
          ) : (
            <div className="result-failure">
              <h2>❌ Verification Failed</h2>
              <p>{result.message}</p>
            </div>
          )}
          <div className="raw-text-container">
            <h3>Full Text Detected:</h3>
            <pre>{result.fullText || 'No text was detected.'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;