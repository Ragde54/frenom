import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Search, X, TrendingUp, Award, Sparkles } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLOR_PALETTE = [
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' }
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedNames, setSelectedNames] = useState(['GABRIEL', 'MARIE']);
  const [gender, setGender] = useState('1'); // '1'=Male, '2'=Female, ''=Both
  const [metric, setMetric] = useState('births'); // 'births' or 'rank'
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  
  // Dual top 10 states for Boys & Girls
  const [topBoys, setTopBoys] = useState([]);
  const [topGirls, setTopGirls] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search autocomplete
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&sexe=${gender}&limit=10`, {
          signal: controller.signal
        });
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.results || []);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Search error:", err);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, gender]);

  // Fetch time series data whenever selectedNames or gender changes
  useEffect(() => {
    if (selectedNames.length === 0) {
      setTimeSeriesData([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const namesParam = selectedNames.join(',');
    const sexeParam = gender ? `&sexe=${gender}` : '';
    fetch(`/api/names/stats?names=${encodeURIComponent(namesParam)}${sexeParam}`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        setTimeSeriesData(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Stats fetch error:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedNames, gender]);

  // Fetch top 10 Boys & Girls rankings for selected year
  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`/api/rankings/top?year=${selectedYear}&sexe=1&limit=10`, { signal: controller.signal }).then(r => r.json()),
      fetch(`/api/rankings/top?year=${selectedYear}&sexe=2&limit=10`, { signal: controller.signal }).then(r => r.json())
    ])
      .then(([boysData, girlsData]) => {
        setTopBoys(boysData.rankings || []);
        setTopGirls(girlsData.rankings || []);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Leaderboard fetch error:", err);
      });

    return () => controller.abort();
  }, [selectedYear]);

  const addName = (name) => {
    const uppercase = name.toUpperCase();
    if (!selectedNames.includes(uppercase)) {
      if (selectedNames.length >= 6) {
        alert("Maximum 6 names can be compared simultaneously.");
        return;
      }
      setSelectedNames([...selectedNames, uppercase]);
    }
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const removeName = (nameToRemove) => {
    setSelectedNames(selectedNames.filter(n => n !== nameToRemove));
  };

  // Process data for Chart.js
  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);

  const chartDatasets = selectedNames.map((name, idx) => {
    const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    const nameDataMap = {};
    timeSeriesData
      .filter(item => item.prenom === name)
      .forEach(item => {
        nameDataMap[item.year] = metric === 'births' ? item.births : item.rank;
      });

    const datasetValues = years.map(y => nameDataMap[y] ?? null);

    return {
      label: name,
      data: datasetValues,
      borderColor: color.border,
      backgroundColor: color.bg,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: 0.35,
      spanGaps: true,
    };
  });

  const chartData = {
    labels: years,
    datasets: chartDatasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: { family: 'Plus Jakarta Sans', size: 13, weight: '600' },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const val = context.parsed.y;
            if (val === null) return `${context.dataset.label}: N/A`;
            return metric === 'births'
              ? `${context.dataset.label}: ${val.toLocaleString()} births`
              : `${context.dataset.label}: Rank #${val}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' }, maxTicksLimit: 15 }
      },
      y: {
        reverse: metric === 'rank', // Rank 1 at the top
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans' },
          callback: (val) => metric === 'births' ? val.toLocaleString() : `#${val}`
        }
      }
    }
  };

  return (
    <div className="app-container">
      {/* Top Banner Header */}
      <header className="header">
        <div className="badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>INSEE Historical Parquet Data (1900–2025)</span>
        </div>
        <h1>Frénom — Historical French Names Explorer</h1>
        <p>Interactive frequency trends and rankings across 6.6 million birth records in France</p>
      </header>

      {/* Control Panel */}
      <div className="card control-panel">
        <div className="control-row">
          {/* Autocomplete Search Bar */}
          <div className="search-container" ref={searchRef}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Type a French baby name (e.g. Gabriel, Marie, Léo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
            />
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {suggestions.map((s, idx) => (
                  <div
                    key={`${s.prenom}-${s.sexe}-${idx}`}
                    className="suggestion-item"
                    onClick={() => addName(s.prenom)}
                  >
                    <div className="suggestion-name">
                      <span>{s.prenom}</span>
                      <span className={`gender-tag ${s.sexe === '1' ? 'male' : 'female'}`}>
                        {s.sexe === '1' ? '👦 Male' : '👧 Female'}
                      </span>
                    </div>
                    <span className="suggestion-count">{s.total_births.toLocaleString()} total births</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gender Filter Pills */}
          <div className="gender-selector">
            <button
              className={`filter-btn ${gender === '1' ? 'active male' : ''}`}
              onClick={() => setGender('1')}
            >
              👦 Male
            </button>
            <button
              className={`filter-btn ${gender === '2' ? 'active female' : ''}`}
              onClick={() => setGender('2')}
            >
              👧 Female
            </button>
            <button
              className={`filter-btn ${gender === '' ? 'active' : ''}`}
              onClick={() => setGender('')}
            >
              👫 Both
            </button>
          </div>
        </div>

        {/* Selected Names Tags */}
        <div className="selected-tags-container">
          <span className="tags-label">Comparing:</span>
          {selectedNames.map((name, idx) => {
            const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
            return (
              <span
                key={name}
                className="name-pill"
                style={{ borderColor: color.border, backgroundColor: color.bg }}
              >
                <span style={{ color: color.border, fontWeight: 700 }}>{name}</span>
                <button className="remove-btn" onClick={() => removeName(name)}>
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section-card">
        <div className="chart-header">
          <div className="chart-title">
            <TrendingUp size={20} className="title-icon" />
            <h2>Historical Trend Visualizer</h2>
          </div>

          <div className="metric-toggle">
            <button
              className={`toggle-btn ${metric === 'births' ? 'active' : ''}`}
              onClick={() => setMetric('births')}
            >
              Total Births
            </button>
            <button
              className={`toggle-btn ${metric === 'rank' ? 'active' : ''}`}
              onClick={() => setMetric('rank')}
            >
              Yearly Rank
            </button>
          </div>
        </div>

        <div className="chart-wrapper">
          {loading ? (
            <div className="loading-spinner">Loading chart data...</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Leaderboard Card Section (Dual Columns for Boys & Girls) */}
      <div className="card leaderboard-card">
        <div className="leaderboard-header">
          <div className="chart-title">
            <Award size={20} className="title-icon" />
            <h2>Top 10 Names Leaderboard ({selectedYear})</h2>
          </div>

          <div className="year-selector">
            <label>Year: </label>
            <input
              type="range"
              min="1900"
              max="2025"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            />
            <span className="year-display">{selectedYear}</span>
          </div>
        </div>

        <div className="leaderboard-columns">
          {/* Top 10 Boys */}
          <div className="gender-leaderboard-col">
            <h3 className="col-title male">👦 Top 10 Boys</h3>
            <div className="leaderboard-grid">
              {topBoys.map((item) => (
                <div
                  key={`boy-${item.rank}-${item.prenom}`}
                  className="rank-card male-card"
                  onClick={() => addName(item.prenom)}
                >
                  <div className="rank-number male-rank">#{item.rank}</div>
                  <div className="rank-info">
                    <div className="rank-name">{item.prenom}</div>
                    <div className="rank-births">{item.births.toLocaleString()} births</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Girls */}
          <div className="gender-leaderboard-col">
            <h3 className="col-title female">👧 Top 10 Girls</h3>
            <div className="leaderboard-grid">
              {topGirls.map((item) => (
                <div
                  key={`girl-${item.rank}-${item.prenom}`}
                  className="rank-card female-card"
                  onClick={() => addName(item.prenom)}
                >
                  <div className="rank-number female-rank">#{item.rank}</div>
                  <div className="rank-info">
                    <div className="rank-name">{item.prenom}</div>
                    <div className="rank-births">{item.births.toLocaleString()} births</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
