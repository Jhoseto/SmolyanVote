// ====== SEARCH AUTOCOMPLETE FUNCTIONALITY ======
// Файл: src/main/resources/static/js/mainEvent/searchAutocomplete.js

/**
 * Управление на автодопълване за търсенето
 */
class SearchAutocomplete {
    constructor() {
        this.searchInput = null;
        this.autocompleteContainer = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        this.searchHistory = this.loadSearchHistory();
        this.init();
    }

    init() {
        this.searchInput = document.getElementById('eventSearch');
        if (!this.searchInput) {
            return;
        }

        // Създаваме контейнер за автодопълване
        this.createAutocompleteContainer();

        // Event listeners
        this.searchInput.addEventListener('input', this.handleInput.bind(this));
        this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.searchInput.addEventListener('focus', this.showSuggestions.bind(this));
        
        // Скриваме автодопълването при клик извън него
        document.addEventListener('click', (e) => {
            if (!this.autocompleteContainer.contains(e.target) && e.target !== this.searchInput) {
                this.hideSuggestions();
            }
        });

        console.log('Search autocomplete initialized');
    }

    createAutocompleteContainer() {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.id = 'searchAutocomplete';
        this.autocompleteContainer.className = 'autocomplete-container';
        this.searchInput.parentElement.appendChild(this.autocompleteContainer);
    }

    handleInput(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            this.showHistory();
            return;
        }

        // Генерираме предложения
        this.generateSuggestions(query);
        this.showSuggestions();
    }

    generateSuggestions(query) {
        this.suggestions = [];
        
        // Добавяме история на търсенията
        const historyMatches = this.searchHistory
            .filter(item => item.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);
        
        historyMatches.forEach(item => {
            this.suggestions.push({
                text: item,
                type: 'history',
                icon: 'bi-clock-history'
            });
        });

        // Добавяме общи предложения (може да се замени с API заявка)
        const commonSuggestions = [
            'Референдум',
            'Анкета',
            'Събитие',
            'Смолян',
            'Гласуване'
        ];

        commonSuggestions
            .filter(s => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5 - this.suggestions.length)
            .forEach(s => {
                this.suggestions.push({
                    text: s,
                    type: 'suggestion',
                    icon: 'bi-lightbulb'
                });
            });
    }

    showHistory() {
        this.suggestions = this.searchHistory.slice(0, 5).map(item => ({
            text: item,
            type: 'history',
            icon: 'bi-clock-history'
        }));
        this.showSuggestions();
    }

    showSuggestions() {
        if (this.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.autocompleteContainer.innerHTML = this.suggestions.map((suggestion, index) => `
            <div class="autocomplete-item ${index === this.selectedIndex ? 'selected' : ''}" 
                 data-index="${index}"
                 onclick="window.searchAutocomplete.selectSuggestion(${index})">
                <i class="bi ${suggestion.icon} me-2"></i>
                <span>${this.highlightMatch(suggestion.text, this.searchInput.value)}</span>
            </div>
        `).join('');

        this.autocompleteContainer.style.display = 'block';
    }

    hideSuggestions() {
        this.autocompleteContainer.style.display = 'none';
        this.selectedIndex = -1;
    }

    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    handleKeyDown(e) {
        if (!this.autocompleteContainer.style.display || this.autocompleteContainer.style.display === 'none') {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                if (this.selectedIndex >= 0) {
                    e.preventDefault();
                    this.selectSuggestion(this.selectedIndex);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    updateSelection() {
        const items = this.autocompleteContainer.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectSuggestion(index) {
        if (index < 0 || index >= this.suggestions.length) {
            return;
        }

        const suggestion = this.suggestions[index];
        this.searchInput.value = suggestion.text;
        this.addToHistory(suggestion.text);
        this.hideSuggestions();
        
        // Submit формата
        const form = document.getElementById('searchForm');
        if (form) {
            form.submit();
        }
    }

    addToHistory(query) {
        if (!query || query.trim().length < 2) {
            return;
        }

        // Премахваме дубликати
        this.searchHistory = this.searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
        
        // Добавяме в началото
        this.searchHistory.unshift(query.trim());
        
        // Ограничаваме до 10 елемента
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        // Запазваме в localStorage
        localStorage.setItem('eventSearchHistory', JSON.stringify(this.searchHistory));
    }

    loadSearchHistory() {
        try {
            const history = localStorage.getItem('eventSearchHistory');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('eventSearchHistory');
        this.hideSuggestions();
    }
}

// Създаване на глобален инстанс
window.searchAutocomplete = new SearchAutocomplete();

