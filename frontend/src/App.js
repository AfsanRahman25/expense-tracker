import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('உணவு');
  const [date, setDate] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('அனைத்தும்');
  const [searchTerm, setSearchTerm] = useState('');

  // பட்ஜெட் தொடர்பான State-கள்
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [newBudget, setNewBudget] = useState('');

  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_URL = `${BASE_URL}/api/expenses`;
  const BUDGET_URL = `${BASE_URL}/api/budget`;

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
  }, []);

  const fetchExpenses = async () => {
    const response = await fetch(API_URL);
    const data = await response.json();
    setExpenses(data);
  };

  const fetchBudget = async () => {
    const response = await fetch(BUDGET_URL);
    const data = await response.json();
    setBudgetLimit(data.limit);
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!newBudget || newBudget <= 0) return;
    await fetch(BUDGET_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: parseFloat(newBudget) }),
    });
    setNewBudget('');
    fetchBudget();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !date) return alert('அனைத்து விவரங்களையும் உள்ளிடவும்!');

    const expenseData = { title, amount: parseFloat(amount), category, date };

    if (editId) {
      const response = await fetch(`${API_URL}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      if (response.ok) setEditId(null);
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
    }

    setTitle('');
    setAmount('');
    setDate('');
    fetchExpenses();
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setTitle(item.title);
    setAmount(item.amount);
    setCategory(item.category);
    setDate(item.date);
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter((item) => {
    const matchesCategory = filterCategory === 'அனைத்தும்' || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // அனைத்து செலவுகளின் மொத்த தொகை (பட்ஜெட் கணக்கீட்டிற்கு)
  const overallTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const filteredTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const isOverBudget = overallTotal > budgetLimit;

  return (
    <div className="container">
      <h2>💰 தனிப்பட்ட செலவுக் கண்காணிப்பு</h2>

      {/* மொத்த தொகை & பட்ஜெட் எச்சரிக்கை */}
      <div className="summary-card" style={{ background: isOverBudget ? '#dc2626' : '' }}>
        <h3>மொத்த செலவு ({filterCategory}): ₹ {filteredTotal.toFixed(2)}</h3>
        <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>
          மாதாந்திர பட்ஜெட்: ₹ {budgetLimit} | மீதமுள்ளது: ₹ {(budgetLimit - overallTotal).toFixed(2)}
        </p>
        {isOverBudget && <p style={{ fontWeight: 'bold', marginTop: '5px' }}>⚠️ எச்சரிக்கை: உங்கள் பட்ஜெட் வரம்பைத் தாண்டிவிட்டீர்கள்!</p>}
      </div>

      {/* பட்ஜெட் மாற்றும் படிவம் */}
      <form onSubmit={handleUpdateBudget} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="புதிய பட்ஜெட் தொகை அமைக்க..."
          value={newBudget}
          onChange={(e) => setNewBudget(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" className="btn btn-update" style={{ flex: '0 0 140px' }}>
          பட்ஜெட் மாற்று
        </button>
      </form>

      {/* செலவு சேர்க்கும் படிவம் */}
      <form onSubmit={handleSubmit} className="expense-form">
        <input type="text" placeholder="செலவின் விவரம்" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" placeholder="தொகை" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="உணவு">உணவு (Food)</option>
          <option value="பயணம்">பயணம் (Travel)</option>
          <option value="பில்கள்">பில்கள் (Bills)</option>
          <option value="மற்றவை">மற்றவை (Other)</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        
        <div className="btn-group">
          <button type="submit" className={`btn ${editId ? 'btn-update' : 'btn-add'}`}>
            {editId ? 'மாற்றங்களைச் சேமி' : 'செலவைச் சேர்'}
          </button>
          {editId && (
            <button type="button" className="btn btn-cancel" onClick={() => { setEditId(null); setTitle(''); setAmount(''); setDate(''); }}>
              ரத்து செய்
            </button>
          )}
        </div>
      </form>

      {/* தேடல் மற்றும் வகை வடிகட்டி */}
      <div className="controls">
        <input
          type="text"
          placeholder="🔍 செலவைத் தேடுங்கள்..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="அனைத்தும்">அனைத்தும்</option>
          <option value="உணவு">உணவு</option>
          <option value="பயணம்">பயணம்</option>
          <option value="பில்கள்">பில்கள்</option>
          <option value="மற்றவை">மற்றவை</option>
        </select>
      </div>

      {/* செலவுப் பட்டியல் */}
      <ul className="expense-list">
        {filteredExpenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>செலவுகள் எதுவும் இல்லை.</p>
        ) : (
          filteredExpenses.map((item) => (
            <li key={item.id} className="expense-item">
              <div className="expense-info">
                <strong>{item.title}</strong>
                <span className="badge">{item.category}</span>
                <br />
                <small style={{ color: '#64748b' }}>{item.date}</small>
              </div>
              <div className="expense-actions">
                <span className="amount">₹ {item.amount}</span>
                <button className="btn-edit" onClick={() => handleEditClick(item)}>திருத்து</button>
                <button className="btn-delete" onClick={() => handleDelete(item.id)}>நீக்கு</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;
