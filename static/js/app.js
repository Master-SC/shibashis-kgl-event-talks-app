// State Management
let allReleases = [];      // Raw releases from API
let parsedUpdates = [];    // Flattened & parsed individual updates
let selectedUpdates = [];  // Array of selected update IDs
let activeFilter = 'all';  // current active type filter
let searchQuery = '';      // current search input query
let sortBy = 'newest';     // sorting order: 'newest' or 'oldest'

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const sortSelect = document.getElementById('sort-select');
const filterPills = document.getElementById('filter-pills');
const releasesGrid = document.getElementById('releases-grid');
const emptyState = document.getElementById('empty-state');
const feedStatus = document.getElementById('feed-status');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Floating Selection Bar Elements
const floatingBar = document.getElementById('floating-bar');
const selectionCount = document.getElementById('selection-count');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const tweetSelectedBtn = document.getElementById('tweet-selected-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const shareTweetBtn = document.getElementById('share-tweet-btn');
const tagPills = document.querySelectorAll('.tag-pill');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// Theme Switch Elements
const themeCheckbox = document.getElementById('theme-checkbox');
const themeLabel = document.querySelector('.theme-label');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    fetchReleases();
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Refresh action
    refreshBtn.addEventListener('click', fetchReleases);

    // Export to CSV action
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Search query input handling
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        renderUpdates();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        renderUpdates();
    });

    // Sorting select
    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderUpdates();
    });

    // Filter categories clicking
    filterPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;

        // Toggle active pill
        document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        pill.classList.add('active');

        activeFilter = pill.dataset.type;
        renderUpdates();
    });

    // Floating selection bar operations
// Reset Filters & Search button
const resetFiltersBtn = document.getElementById('reset-filters-btn');
if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        // Reset search
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        // Reset filter to 'all'
        activeFilter = 'all';
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.type === 'all');
        });
        renderUpdates();
    });
}
    clearSelectionBtn.addEventListener('click', clearSelection);
    tweetSelectedBtn.addEventListener('click', openComposerForSelected);

    // Modal close controls
    closeModalBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on clicking outside the card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Tweet character counter
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Theme Switch Toggle
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', toggleTheme);
    }

    // Action buttons inside composer
    copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    shareTweetBtn.addEventListener('click', shareToTwitter);

    // Add hashtag pills click event
    tagPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const tag = pill.dataset.tag;
            insertHashtag(tag);
        });
    });
}

// Fetch Release Notes Feed from API
async function fetchReleases() {
    try {
        setLoadingState(true);
        updateFeedStatus('syncing', 'Fetching updates...');
        
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            allReleases = data.entries || [];
            processAndFlattenReleases(allReleases);
            
            // Format updated time
            const lastUpdated = data.updated ? formatDate(data.updated) : 'Recently';
            updateFeedStatus('online', `Synced: ${lastUpdated}`);
            showToast('success', 'Release notes synced successfully!');
        } else {
            throw new Error(data.error || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        updateFeedStatus('error', 'Failed to fetch release notes');
        showToast('error', `Sync failed: ${error.message}`);
        
        // Show empty releases structure
        releasesGrid.innerHTML = '';
        emptyState.style.display = 'flex';
    } finally {
        setLoadingState(false);
    }
}

// Set Loading UI State
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshIcon.classList.add('spinning');
        // Clear grid and show skeletons
        releasesGrid.innerHTML = `
            <div class="skeleton-card card-blur">
                <div class="skeleton-header">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-date"></div>
                </div>
                <div class="skeleton-body">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
            <div class="skeleton-card card-blur">
                <div class="skeleton-header">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-date"></div>
                </div>
                <div class="skeleton-body">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
        emptyState.style.display = 'none';
    } else {
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('spinning');
    }
}

// Update Feed Status Indicator
function updateFeedStatus(state, message) {
    const dot = feedStatus.querySelector('.status-dot');
    const text = feedStatus.querySelector('.status-text');
    
    text.textContent = message;
    dot.className = 'status-dot'; // Reset classes
    
    if (state === 'syncing') {
        dot.classList.add('pulsing');
        dot.style.backgroundColor = 'var(--accent-blue)';
    } else if (state === 'online') {
        dot.style.backgroundColor = 'var(--color-feature)';
    } else if (state === 'error') {
        dot.style.backgroundColor = 'var(--color-issue)';
    }
}

// Parse and Flatten Release Notes Entry HTML into Individual Updates
function processAndFlattenReleases(entries) {
    parsedUpdates = [];
    
    entries.forEach(entry => {
        const updatesFromEntry = parseEntryUpdates(entry);
        parsedUpdates.push(...updatesFromEntry);
    });
    
    // Sort parsedUpdates initially (default is newest)
    sortParsedUpdates();
    
    // Clear selection on new fetch
    clearSelection();
    
    // Update counters in Filter bar
    updateCategoryCounts();
    
    // Render
    renderUpdates();
}

// Parse one Day-Entry's HTML content
function parseEntryUpdates(entry) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, 'text/html');
    const body = doc.body;
    
    const updates = [];
    let currentType = null;
    let currentElements = [];
    let updateCount = 0;
    
    // Iterate through children to group content by <h3> headers
    for (let i = 0; i < body.children.length; i++) {
        const child = body.children[i];
        
        if (child.tagName === 'H3') {
            // Save preceding group
            if (currentType && currentElements.length > 0) {
                updates.push(createUpdateObject(entry, currentType, currentElements, updateCount++));
            }
            // Start a new group
            currentType = child.textContent.trim();
            currentElements = [];
        } else {
            // Collect sibling elements (p, ul, code etc.)
            if (currentType) {
                currentElements.push(child);
            } else {
                // If there's content before any H3, default it to "Feature"
                currentType = "Feature";
                currentElements.push(child);
            }
        }
    }
    
    // Save last group
    if (currentType && currentElements.length > 0) {
        updates.push(createUpdateObject(entry, currentType, currentElements, updateCount++));
    }
    
    // Edge case: empty body or body without headings/structure
    if (updates.length === 0 && entry.content.trim() !== '') {
        updates.push({
            id: `${entry.id}-full`,
            date: entry.title,
            isoDate: entry.updated,
            type: 'Feature',
            contentHtml: entry.content,
            contentText: body.textContent.trim(),
            link: entry.link || 'https://cloud.google.com/bigquery/docs/release-notes',
            originalEntryId: entry.id
        });
    }
    
    return updates;
}

// Helper to create update object and extract clean text content
function createUpdateObject(entry, type, elements, index) {
    const contentHtml = elements.map(el => el.outerHTML).join('\n');
    
    // Parse plain text version for Tweeting (strip HTML tags but preserve text flow)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    
    // Standardize links inside code: replace link tags with text to save space
    tempDiv.querySelectorAll('a').forEach(a => {
        a.replaceWith(a.textContent);
    });
    
    // Standardize text content
    const contentText = tempDiv.textContent
        .replace(/\s+/g, ' ')
        .trim();
        
    return {
        id: `${entry.id}#update-${index}`,
        date: entry.title,
        isoDate: entry.updated,
        type: type,
        contentHtml: contentHtml,
        contentText: contentText,
        link: entry.link || 'https://cloud.google.com/bigquery/docs/release-notes',
        originalEntryId: entry.id
    };
}

// Update Category Counters
function updateCategoryCounts() {
    const counts = {
        all: parsedUpdates.length,
        Feature: 0,
        Change: 0,
        Issue: 0,
        Deprecated: 0
    };
    
    parsedUpdates.forEach(up => {
        if (counts[up.type] !== undefined) {
            counts[up.type]++;
        }
    });
    
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-feature').textContent = counts.Feature;
    document.getElementById('count-change').textContent = counts.Change;
    document.getElementById('count-issue').textContent = counts.Issue;
    document.getElementById('count-deprecated').textContent = counts.Deprecated;
}

// Sort parsed updates array
function sortParsedUpdates() {
    parsedUpdates.sort((a, b) => {
        const dateA = new Date(a.isoDate || a.date);
        const dateB = new Date(b.isoDate || b.date);
        
        if (sortBy === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
}

// Get currently filtered releases based on search query and category filters
function getFilteredUpdates() {
    return parsedUpdates.filter(update => {
        const matchesFilter = (activeFilter === 'all' || update.type === activeFilter);
        const matchesSearch = !searchQuery || 
            update.type.toLowerCase().includes(searchQuery) ||
            update.date.toLowerCase().includes(searchQuery) ||
            update.contentText.toLowerCase().includes(searchQuery);
            
        return matchesFilter && matchesSearch;
    });
}

// Render filtered and sorted updates into releases grid
function renderUpdates() {
    sortParsedUpdates();
    
    let filtered = getFilteredUpdates();
    
    // Clear grid
    releasesGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Render cards
    filtered.forEach(update => {
        const card = document.createElement('article');
        const isSelected = selectedUpdates.includes(update.id);
        
        card.className = `update-card card-blur type-${update.type.toLowerCase()}`;
        if (isSelected) card.classList.add('selected');
        card.dataset.id = update.id;
        
        // Render card inner HTML
        card.innerHTML = `
            <div class="card-header-row">
                <div class="card-meta-left">
                    <span class="category-badge badge-${update.type.toLowerCase()}">${update.type}</span>
                    <span class="date-text">
                        <i class="fa-regular fa-calendar"></i> ${update.date}
                    </span>
                </div>
                <div class="card-actions-right">
                    <div class="card-select-checkbox" title="Select this update to Tweet">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>
            </div>
            <div class="card-body-content">
                ${update.contentHtml}
            </div>
            <div class="card-footer-actions">
                <a href="${update.link}" target="_blank" class="card-btn" onclick="event.stopPropagation();" title="View official release documentation">
                    <i class="fa-solid fa-up-right-from-square"></i> Docs
                </a>
                <button class="card-btn card-copy-btn" title="Copy text content to clipboard">
                    <i class="fa-regular fa-copy"></i> Copy
                </button>
                <button class="card-btn card-tweet-btn" title="Compose a Tweet about this update">
                    <i class="fa-brands fa-x-twitter"></i> Tweet
                </button>
            </div>
        `;
        
        // Add card selection clicking behavior
        card.addEventListener('click', (e) => {
            // Prevent selection trigger when clicking buttons or links
            if (e.target.closest('.card-btn') || e.target.closest('a')) {
                return;
            }
            
            toggleUpdateSelection(update.id);
        });
        
        // Copy button inside card click event
        const copyBtn = card.querySelector('.card-copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyTextToClipboard(update.contentText, 'Release note copied to clipboard!');
        });
        
        // Tweet button inside card click event
        const tweetBtn = card.querySelector('.card-tweet-btn');
        tweetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openComposerForSingle(update);
        });
        
        releasesGrid.appendChild(card);
    });
}

// Toggle selection state of card
function toggleUpdateSelection(updateId) {
    const index = selectedUpdates.indexOf(updateId);
    
    if (index === -1) {
        // Select it (support single selection, but we can do multiple as a premium experience!)
        // Wait, if they select it, do they want to select multiple?
        // Let's support selecting one at a time or combining them.
        // Actually, let's keep it simple: select multiple, but when you tweet, it compiles them.
        // Let's toggle the class on DOM as well.
        selectedUpdates.push(updateId);
    } else {
        // Deselect it
        selectedUpdates.splice(index, 1);
    }
    
    // Update card class in DOM immediately
    const cardEl = document.querySelector(`.update-card[data-id="${CSS.escape(updateId)}"]`);
    if (cardEl) {
        cardEl.classList.toggle('selected', index === -1);
    }
    
    updateFloatingBar();
}

// Clear all card selections
function clearSelection() {
    selectedUpdates = [];
    document.querySelectorAll('.update-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    updateFloatingBar();
}

// Update UI of Floating Selection Bar
function updateFloatingBar() {
    const count = selectedUpdates.length;
    selectionCount.textContent = count;
    
    if (count > 0) {
        floatingBar.classList.add('visible');
    } else {
        floatingBar.classList.remove('visible');
    }
}

// Generate the Tweet Template text
function generateTweetText(updatesToTweet) {
    if (updatesToTweet.length === 0) return '';
    
    if (updatesToTweet.length === 1) {
        const update = updatesToTweet[0];
        // Shorten content text if it is too long
        let text = update.contentText;
        const maxLen = 175; // Save characters for title, tags and link
        if (text.length > maxLen) {
            text = text.substring(0, maxLen - 3) + '...';
        }
        
        return `🚀 BigQuery [${update.type}] (${update.date}):\n"${text}"\n\n#BigQuery #GoogleCloud #GCP\n${update.link}`;
    } else {
        // Multi-select tweeting compiler
        const date = updatesToTweet[0].date;
        const typesStr = [...new Set(updatesToTweet.map(u => u.type))].join(' & ');
        
        let text = `📢 Google Cloud BigQuery Updates (${date}):\n`;
        updatesToTweet.forEach((update, idx) => {
            let summary = update.contentText;
            if (summary.length > 70) {
                summary = summary.substring(0, 67) + '...';
            }
            text += `• [${update.type}] ${summary}\n`;
        });
        
        // Trim combined text if necessary to fit link/tags
        const maxCombinedLen = 200;
        if (text.length > maxCombinedLen) {
            text = text.substring(0, maxCombinedLen - 3) + '...\n';
        }
        
        return `${text}\n#BigQuery #GoogleCloud\n${updatesToTweet[0].link}`;
    }
}

// Open Tweet Composer Modal for a single update (via Card Tweet Button)
function openComposerForSingle(update) {
    const tweetText = generateTweetText([update]);
    tweetTextarea.value = tweetText;
    updateCharCounter();
    openTweetModal();
}

// Open Tweet Composer Modal for all currently selected updates (via Floating Bar)
function openComposerForSelected() {
    if (selectedUpdates.length === 0) return;
    
    // Gather full update objects of selected updates
    const updates = parsedUpdates.filter(u => selectedUpdates.includes(u.id));
    const tweetText = generateTweetText(updates);
    
    tweetTextarea.value = tweetText;
    updateCharCounter();
    openTweetModal();
}

// Open Composer Modal
function openTweetModal() {
    tweetModal.classList.add('open');
    tweetTextarea.focus();
}

// Close Composer Modal
function closeTweetModal() {
    tweetModal.classList.remove('open');
}

// Update Character Counter in Composer
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = len;
    
    const container = charCounter.parentElement;
    container.className = 'char-counter-container'; // reset
    
    if (len > 280) {
        container.classList.add('limit-danger');
        shareTweetBtn.disabled = true;
    } else if (len > 250) {
        container.classList.add('limit-warning');
        shareTweetBtn.disabled = false;
    } else {
        shareTweetBtn.disabled = false;
    }
}

// Insert Hashtag into composer text
function insertHashtag(tag) {
    let currentText = tweetTextarea.value;
    
    // If tag already exists, do nothing
    if (currentText.includes(tag)) {
        showToast('info', `Hashtag ${tag} is already in the tweet.`);
        return;
    }
    
    // Find if there are hashtags at the bottom or just append it
    // Usually hashtags are appended at the end before or after the link.
    // Let's insert it before the URL if URL is at the end
    const urlPattern = /https:\/\/cloud\.google\.com\/bigquery[^\s]*|https:\/\/docs\.google[^\s]*/i;
    const match = currentText.match(urlPattern);
    
    if (match) {
        const urlIndex = match.index;
        const beforeUrl = currentText.substring(0, urlIndex).trim();
        const url = match[0];
        
        // Insert hashtag before the link
        tweetTextarea.value = `${beforeUrl} ${tag}\n\n${url}`;
    } else {
        tweetTextarea.value = `${currentText.trim()} ${tag}`;
    }
    
    updateCharCounter();
    showToast('success', `Added ${tag}`);
}

// Copy Text to Clipboard general utility
async function copyTextToClipboard(text, successMsg = 'Text copied to clipboard!') {
    try {
        await navigator.clipboard.writeText(text);
        showToast('success', successMsg);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('error', 'Could not copy to clipboard.');
    }
}

// Copy Tweet Text to Clipboard
function copyTweetToClipboard() {
    copyTextToClipboard(tweetTextarea.value, 'Tweet copied to clipboard!');
}

// Export releases to CSV
function exportToCSV() {
    // If updates are selected, export only selected ones, otherwise export currently filtered ones
    const updatesToExport = selectedUpdates.length > 0
        ? parsedUpdates.filter(u => selectedUpdates.includes(u.id))
        : getFilteredUpdates();
        
    if (updatesToExport.length === 0) {
        showToast('error', 'No releases available to export.');
        return;
    }
    
    const headers = ['Date', 'Category', 'Content', 'Documentation Link'];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];
    
    updatesToExport.forEach(up => {
        const row = [
            up.date,
            up.type,
            up.contentText,
            up.link
        ];
        csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Date timestamp for file name
        const timestamp = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const count = updatesToExport.length;
        const targetStr = selectedUpdates.length > 0 ? 'selected' : 'filtered';
        showToast('success', `Exported ${count} ${targetStr} updates to CSV!`);
    } catch (err) {
        console.error('CSV export failed:', err);
        showToast('error', 'Failed to export CSV file.');
    }
}

// Open Twitter/X Web Intent page
function shareToTwitter() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        showToast('error', 'Tweet is too long! Limit is 280 characters.');
        return;
    }
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420,toolbar=no,menubar=no,scrollbars=yes');
}

// Helper to Format Date String (e.g. from Atom ISO format)
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        
        // e.g. "June 15, 2026, 10:30 AM" or similar
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// Show System Toast Message
let toastTimeout;
function showToast(type, message) {
    clearTimeout(toastTimeout);
    
    toastMessage.textContent = message;
    
    // Set appropriate icon
    toastIcon.className = 'toast-icon fa-solid';
    if (type === 'success') {
        toastIcon.classList.add('fa-circle-check');
        toastIcon.style.color = 'var(--color-feature)';
    } else if (type === 'error') {
        toastIcon.classList.add('fa-circle-exclamation');
        toastIcon.style.color = 'var(--color-issue)';
    } else {
        toastIcon.classList.add('fa-circle-info');
        toastIcon.style.color = 'var(--accent-blue)';
    }
    
    toast.classList.add('visible');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, 3500);
}

// Theme switch handler
function toggleTheme(e) {
    if (e.target.checked) {
        document.body.classList.add('light-mode');
        if (themeLabel) {
            themeLabel.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
        }
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        if (themeLabel) {
            themeLabel.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
        }
        localStorage.setItem('theme', 'dark');
    }
}

// Theme initialization
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        if (themeCheckbox) themeCheckbox.checked = true;
        document.body.classList.add('light-mode');
        if (themeLabel) {
            themeLabel.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
        }
    } else {
        if (themeCheckbox) themeCheckbox.checked = false;
        document.body.classList.remove('light-mode');
        if (themeLabel) {
            themeLabel.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
        }
    }
}
