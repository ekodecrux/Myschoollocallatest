import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Mic as MicIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  School as AcademicIcon,
  Image as ImageIcon,
  AutoStories as StoryIcon,
  Create as MakerIcon,
  Category as CategoryIcon,
  ArrowForward as ArrowIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Separate component for search image thumbnails with safe error handling
const SearchImageThumbnail = ({ img, onClick }) => {
  const [hasError, setHasError] = useState(false);
  const imgSrc = img.thumbnail || img.path || '';
  
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        width: 80,
        textAlign: 'center',
        '&:hover': { opacity: 0.8 }
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 60,
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5
        }}
      >
        {hasError ? (
          <BrokenImageIcon sx={{ color: '#bdbdbd', fontSize: 30 }} />
        ) : (
          <img
            src={imgSrc}
            alt={img.title || 'Image'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover'
            }}
            onError={() => setHasError(true)}
          />
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: '10px',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#333'
        }}
      >
        {img.title || 'Image'}
      </Typography>
    </Box>
  );
};

// Knowledge base for smart suggestions
const KNOWLEDGE_BASE = {
  categories: [
    { name: 'Academic', icon: <AcademicIcon />, path: '/views/academic', color: '#2196f3', keywords: ['class', 'grade', 'subject', 'math', 'science', 'english', 'hindi'] },
    { name: 'Image Bank', icon: <ImageIcon />, path: '/views/result', color: '#4caf50', keywords: ['image', 'picture', 'photo', 'animal', 'object'] },
    { name: 'Makers', icon: <MakerIcon />, path: '/views/maker/makers', color: '#ff9800', keywords: ['chart', 'worksheet', 'story', 'lesson', 'scheduler'] },
    { name: 'Early Career', icon: <StoryIcon />, path: '/views/early-career', color: '#9c27b0', keywords: ['story', 'career', 'moral', 'value'] },
  ],
  quickLinks: [
    { name: 'Smart Wall', path: '/views/academic/smart-wall?ocrc', category: 'Resources' },
    { name: 'Chart Maker', path: '/views/maker/makers/chart-maker?main=0&mu=0', category: 'Makers' },
    { name: 'Worksheet Maker', path: '/views/maker/makers/worksheet-maker', category: 'Makers' },
    { name: 'Story Maker', path: '/views/maker/makers/story-maker', category: 'Makers' },
    { name: 'Micro Scheduler', path: '/views/maker/makers/micro-scheduler', category: 'Makers' },
    { name: 'MCQ Bank', path: '/views/academic/result?text=mcq', category: 'Resources' },
    { name: 'Exam Tips', path: '/views/academic/result?text=exam tips', category: 'Resources' },
    { name: 'Great Personalities', path: '/views/academic/imagebank/great-personalities', category: 'Content' },
    { name: 'Comics', path: '/views/sections/imagebank/comics?main=2&mu=8', category: 'Content' },
    { name: 'Discovery', path: '/views/sections/imagebank/discovery?main=2&mu=10', category: 'Content' },
  ],
  animalKeywords: ['monkey', 'dog', 'cat', 'elephant', 'lion', 'tiger', 'bird', 'fish', 'fishes', 'cow', 'cows', 'horse', 'rabbit', 'bear', 'deer', 'giraffe', 'zebra', 'snake', 'frog', 'butterfly', 'bee', 'ant', 'parrot', 'peacock', 'camel', 'goat', 'sheep', 'pig', 'duck', 'hen', 'rooster', 'crow', 'sparrow', 'owl', 'eagle', 'vulture', 'squirrel', 'mouse', 'rat', 'fox', 'wolf', 'cheetah', 'leopard', 'panda', 'koala', 'kangaroo', 'crocodile', 'alligator', 'turtle', 'tortoise', 'dolphin', 'whale', 'shark', 'octopus', 'crab', 'lobster', 'snail', 'spider', 'scorpion', 'grasshopper', 'dragonfly', 'ladybug'],
  objectKeywords: ['tree', 'flower', 'plant', 'mountain', 'river', 'sun', 'moon', 'star', 'cloud', 'rain', 'house', 'car', 'bus', 'train', 'boat', 'ball', 'toy', 'book', 'pencil', 'chair', 'bicycle', 'airplane', 'computer', 'phone', 'table', 'bed', 'clock', 'lamp', 'fan', 'door', 'window', 'bridge', 'road', 'building', 'school', 'hospital', 'park', 'garden', 'forest', 'beach', 'ocean', 'lake', 'pond', 'waterfall', 'volcano', 'desert', 'island', 'rainbow', 'thunder', 'lightning', 'snow', 'ice', 'fire', 'water', 'earth', 'air', 'fruit', 'vegetable', 'food'],
  grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  subjects: {
    english: { code: '1', name: 'English' },
    hindi: { code: '2', name: 'Hindi' },
    maths: { code: '3', name: 'Maths' },
    science: { code: '4', name: 'Science' },
    computer: { code: 'unknown', name: 'Computer' },
    evs: { code: 'unknown', name: 'EVS' },
    social: { code: 'unknown', name: 'Social Studies' },
  }
};
// Trending searches
const TRENDING_SEARCHES = [
  'Class 5 Maths', 'Tiger Images', 'Chart Maker', 'Moral Stories', 'MCQ English'
];
const EnhancedSearch = ({ onSearch, variant = 'home' }) => {
  const navigate = useNavigate();
  const reactLocation = useLocation();
  
  // Decode URL parameter immediately
  const getDecodedFromURL = () => {
    try {
      const params = new URLSearchParams(reactLocation.search || window.location.search);
      const textParam = params.get('text');
      if (textParam) {
        // Handle both encoded and already-decoded text
        const decoded = textParam.includes('%') ? decodeURIComponent(textParam) : textParam;
        return decoded.replace(/%20/g, ' ');
      }
    } catch (e) {
      console.error('Decode error:', e);
    }
    return '';
  };
  
  const [searchText, setSearchText] = useState(() => getDecodedFromURL());
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Update searchText when location changes
  useEffect(() => {
    const decoded = getDecodedFromURL();
    if (decoded) {
      setSearchText(decoded);
    }
  }, [reactLocation]);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchText(transcript);
        setIsListening(false);
        setIsFocused(true);
      };
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  // Handle voice input
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsFocused(true);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setIsListening(false);
      }
    }
  };
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myschool-recent-searches') || '[]');
    setRecentSearches(saved.slice(0, 5));
  }, []);
  // Save search to recent
  const saveToRecent = (text) => {
    const saved = JSON.parse(localStorage.getItem('myschool-recent-searches') || '[]');
    const updated = [text, ...saved.filter(s => s !== text)].slice(0, 10);
    localStorage.setItem('myschool-recent-searches', JSON.stringify(updated));
    setRecentSearches(updated.slice(0, 5));
  };
  // State for backend image results
  const [imageResults, setImageResults] = useState([]);
  // Fetch suggestions from backend API
  const fetchBackendSuggestions = async (query) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rest/search/global?query=${encodeURIComponent(query)}&size=6`);
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      // Silent fail - use local suggestions
    }
    return [];
  };
  // Fetch backend image results when search text changes
  useEffect(() => {
    const query = searchText.toLowerCase().trim();
    if (query.length >= 2) {
      setIsLoading(true);
      fetchBackendSuggestions(query).then((backendResults) => {
        const images = backendResults
          .filter(result => result.type === 'image' && result.path)
          .slice(0, 4)
          .map(result => ({
            type: 'image-result',
            title: result.title || 'Image',
            path: result.path,
            thumbnail: result.thumbnail,
            category: result.category
          }));
        setImageResults(images);
        setIsLoading(false);
      });
    } else {
      setImageResults([]);
    }
  }, [searchText]);
  // Generate smart suggestions based on input
  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchText.toLowerCase().trim();
    const newSuggestions = [];
    // Check for grade + subject pattern (e.g., "class 5 maths", "class 1 maths")
    const gradeMatch = query.match(/(?:class|grade|standard)\s*(\d+)/i);
    const subjectKeywords = Object.keys(KNOWLEDGE_BASE.subjects);
    const matchedSubject = subjectKeywords.find(s => query.includes(s));
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[1]);
      if (KNOWLEDGE_BASE.grades.includes(gradeNum)) {
        if (matchedSubject) {
          const subject = KNOWLEDGE_BASE.subjects[matchedSubject];
          // Navigate to Academic > Class > Class-N > Subject (e.g., /views/academic/class/class-1/maths)
          newSuggestions.push({
            type: 'academic',
            title: `Class ${gradeNum} ${subject.name}`,
            subtitle: 'Academic - Class',
            path: `/views/academic/class/class-${gradeNum}/${subject.name.toLowerCase()}`,
            icon: <AcademicIcon />,
            color: '#2196f3'
          });
        } else {
          // Just class without subject - go to class page
          newSuggestions.push({
            type: 'academic',
            title: `Class ${gradeNum} Resources`,
            subtitle: 'Academic - Class',
            path: `/views/academic/class/class-${gradeNum}`,
            icon: <AcademicIcon />,
            color: '#2196f3'
          });
        }
      }
    }
    // Check for subject-only match (e.g., "math", "science", "english")
    if (!gradeMatch && matchedSubject) {
      const subject = KNOWLEDGE_BASE.subjects[matchedSubject];
      newSuggestions.push({
        type: 'academic',
        title: `${subject.name} Resources`,
        subtitle: 'All classes',
        path: `/views/academic/result?text=${encodeURIComponent(subject.name)}`,
        icon: <AcademicIcon />,
        color: '#2196f3'
      });
      // Add suggestions for popular classes with this subject
      [1, 5, 8, 10].forEach(classNum => {
        newSuggestions.push({
          type: 'academic',
          title: `Class ${classNum} ${subject.name}`,
          subtitle: 'Academic - Class',
          path: `/views/academic/class/class-${classNum}/${subject.name.toLowerCase()}`,
          icon: <AcademicIcon />,
          color: '#2196f3'
        });
      });
    }
    // Check for animal/object keywords (Image Bank)
    const matchedAnimal = KNOWLEDGE_BASE.animalKeywords.find(k => k.includes(query) || query.includes(k));
    const matchedObject = KNOWLEDGE_BASE.objectKeywords.find(k => k.includes(query) || query.includes(k));
    if (matchedAnimal || matchedObject) {
      newSuggestions.push({
        type: 'imagebank',
        title: `Search Images: "${searchText}"`,
        path: `/views/result?text=${encodeURIComponent(searchText)}`,
        icon: <ImageIcon />,
        color: '#4caf50'
      });
    }
    // Check quick links (partial matching)
    KNOWLEDGE_BASE.quickLinks.forEach(link => {
      if (link.name.toLowerCase().includes(query) || query.split(' ').some(word => link.name.toLowerCase().includes(word) && word.length >= 2)) {
        newSuggestions.push({
          type: 'quicklink',
          title: link.name,
          path: link.path,
          category: link.category,
          icon: link.category === 'Makers' ? <MakerIcon /> : <CategoryIcon />,
          color: link.category === 'Makers' ? '#ff9800' : '#9c27b0'
        });
      }
    });
    // Check category keywords for matching (e.g., "academic", "maker")
    KNOWLEDGE_BASE.categories.forEach(cat => {
      const catMatches = cat.name.toLowerCase().includes(query) || 
                         cat.keywords.some(kw => kw.includes(query) || query.includes(kw));
      if (catMatches && !newSuggestions.some(s => s.path === cat.path)) {
        newSuggestions.push({
          type: 'category',
          title: `Browse ${cat.name}`,
          path: cat.path,
          icon: cat.icon,
          color: cat.color
        });
      }
    });
    // Always add general search option when there's text (at least 2 chars)
    if (searchText.length >= 2) {
      newSuggestions.push({
        type: 'search',
        title: `Search for "${searchText}"`,
        path: `/views/result?text=${encodeURIComponent(searchText)}`,
        icon: <SearchIcon />,
        color: '#666'
      });
    }
    // Remove duplicates based on path and limit to 6
    const uniqueSuggestions = newSuggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.path === item.path)
    );
    setSuggestions(uniqueSuggestions.slice(0, 6));
  }, [searchText]);
  // Handle search submission
  const handleSearch = (path) => {
    if (searchText.trim()) {
      saveToRecent(searchText.trim());
    }
    setIsFocused(false);
    setSearchText('');
    if (path) {
      navigate(path);
    } else if (searchText.trim()) {
      navigate({ pathname: '/views/result', search: `?text=${searchText}` });
    }
  };
  
  // Parse multi-word search to create navigation path
  const parseMultiWordSearch = (text) => {
    const words = text.toLowerCase().trim().split(/\s+/);
    
    // Single word - do direct search
    if (words.length === 1) {
      return { type: 'direct', path: `/views/result?text=${encodeURIComponent(text)}` };
    }
    
    // Multi-word: try to build navigation path
    // Pattern: "class 1 maths" -> Academic/Class/Class-1 + search "maths"
    const classMatch = text.match(/(?:class|grade|standard)\s*(\d+)/i);
    if (classMatch) {
      const classNum = classMatch[1];
      const lastWord = words[words.length - 1];
      // Check if last word is a subject
      const subjects = ['maths', 'math', 'english', 'hindi', 'science', 'evs', 'gk', 'computer'];
      if (subjects.includes(lastWord)) {
        return { 
          type: 'navigation', 
          path: `/views/academic/class/class-${classNum}/${lastWord}`,
          searchTerm: null 
        };
      } else {
        // Navigate to class and search for last word
        return { 
          type: 'navigation', 
          path: `/views/academic/class/class-${classNum}?text=${encodeURIComponent(lastWord)}`,
          searchTerm: lastWord 
        };
      }
    }
    
    // Default: direct search
    return { type: 'direct', path: `/views/result?text=${encodeURIComponent(text)}` };
  };
  
  // Handle keyboard
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If we have suggestions, use the first one
      if (suggestions.length > 0) {
        handleSearch(suggestions[0].path);
      } else if (searchText.trim()) {
        // Parse multi-word search for intelligent navigation
        const parsed = parseMultiWordSearch(searchText);
        handleSearch(parsed.path);
      }
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const showDropdown = isFocused && (searchText.length > 0 || recentSearches.length > 0);
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: variant === 'home' ? 600 : 400 }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        placeholder={isListening ? "Listening... Speak now" : "Search your wish here..."}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        sx={{
          '.MuiOutlinedInput-root': {
            borderRadius: '28px',
            backgroundColor: '#fff',
            boxShadow: isFocused ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
            '& fieldset': {
              border: 'none',
            }
          },
          '.MuiInputBase-input': {
            py: 1.5,
            px: 2,
            fontSize: variant === 'home' ? '1.1rem' : '0.95rem',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#1976d2', ml: 1 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end" sx={{ gap: 0.5 }}>
              {searchText && (
                <IconButton size="small" onClick={() => setSearchText('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton 
                size="small" 
                onClick={handleVoiceInput}
                sx={{ 
                  color: isListening ? '#f44336' : '#666',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' },
                  }
                }}
                title={isListening ? 'Listening... Click to stop' : 'Click to speak'}
              >
                <MicIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {/* Dropdown */}
      <Fade in={showDropdown}>
        <Paper
          ref={dropdownRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: 450,
            overflow: 'auto'
          }}
        >
          {/* Image Results from Backend */}
          {imageResults.length > 0 && (
            <>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Found Images
                </Typography>
              </Box>
              <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {imageResults.map((img, idx) => (
                  <SearchImageThumbnail
                    key={idx}
                    img={img}
                    onClick={() => handleSearch(`/views/result?text=${encodeURIComponent(searchText)}`)}
                  />
                ))}
              </Box>
              <Divider />
            </>
          )}
          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <List dense sx={{ py: 1 }}>
                {suggestions.map((suggestion, idx) => (
                  <ListItem
                    key={idx}
                    button
                    onClick={() => handleSearch(suggestion.path)}
                    sx={{ 
                      py: 1.5,
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: suggestion.color }}>
                      {suggestion.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion.title}
                      secondary={suggestion.category}
                      primaryTypographyProps={{ fontSize: '0.95rem' }}
                    />
                    <ArrowIcon sx={{ color: '#999', fontSize: 18 }} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}
          {/* Recent Searches - shown when no input */}
          {!searchText && recentSearches.length > 0 && (
            <>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Recent Searches
                </Typography>
              </Box>
              <List dense sx={{ py: 0 }}>
                {recentSearches.map((search, idx) => (
                  <ListItem
                    key={idx}
                    button
                    onClick={() => {
                      setSearchText(search);
                      handleSearch(`/views/result?text=${encodeURIComponent(search)}`);
                    }}
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <HistoryIcon fontSize="small" sx={{ color: '#999' }} />
                    </ListItemIcon>
                    <ListItemText primary={search} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}
          {/* Trending */}
          {!searchText && (
            <>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Trending Searches
                </Typography>
              </Box>
              <Box sx={{ px: 2, pb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {TRENDING_SEARCHES.map((term, idx) => (
                  <Chip
                    key={idx}
                    label={term}
                    size="small"
                    icon={<TrendingIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      setSearchText(term);
                      handleSearch(`/views/result?text=${encodeURIComponent(term)}`);
                    }}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#e3f2fd' }
                    }}
                  />
                ))}
              </Box>
            </>
          )}
          {/* Quick Categories - shown when no input */}
          {!searchText && (
            <>
              <Divider />
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Browse by Category
                </Typography>
              </Box>
              <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {KNOWLEDGE_BASE.categories.map((cat, idx) => (
                  <Chip
                    key={idx}
                    label={cat.name}
                    size="small"
                    icon={cat.icon}
                    onClick={() => navigate(cat.path)}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      '&:hover': { backgroundColor: `${cat.color}25` },
                      '& .MuiChip-icon': { color: cat.color }
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};
export default EnhancedSearch;
