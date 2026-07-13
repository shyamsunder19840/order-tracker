import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrders, setQuery, clearResults } from '../store/ordersSlice.js'

export default function SearchBar() {
  const dispatch           = useDispatch()
  const { query, loading } = useSelector((s) => s.orders)
  const [input, setInput]  = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const v = input.trim()
    if (!v) return
    dispatch(setQuery(v))
    dispatch(fetchOrders(v))
  }

  return (
    <div className="search-card">
      <h2 className="search-title">Search Sales Order</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          className="search-input"
          type="text"
          placeholder="Enter Customer PO Number  (e.g. 5500589510)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        {query && (
          <button className="btn btn-secondary" type="button"
            onClick={() => { setInput(''); dispatch(clearResults()) }}>
            Clear
          </button>
        )}
      </form>
      {query && !loading && (
        <p className="search-hint">Results for: <strong>{query}</strong></p>
      )}
    </div>
  )
}
