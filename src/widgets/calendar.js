let currentDate = new Date();
let cachedEvents = [];

function parseICS(icsText) {
    const events = [];
    const lines = icsText.split(/\r\n|\n|\r/);
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.start) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('DTSTART')) {
                const parts = line.split(':');
                if (parts.length > 1) {
                    currentEvent.start = parts[1];
                }
            } else if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.substring(8);
            }
        }
    }
    return events;
}

export function renderCalendar(settings) {
    const widgetWrapper = document.createElement('div');
    widgetWrapper.style.cursor = 'pointer';

    // General click handler for the whole widget
    widgetWrapper.addEventListener('click', () => {
        window.open('https://calendar.google.com', '_self');
    });

    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';

    const updateCalendar = () => {
        calendarContainer.innerHTML = ''; // Clear previous calendar

        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.onclick = (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendar();
        };

        const monthYear = document.createElement('span');
        monthYear.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthYear.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent widget-level click
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const url = `https://calendar.google.com/calendar/r/month/${year}/${month}/1`;
            window.open(url, '_self');
        });

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.onclick = (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendar();
        };

        header.appendChild(prevButton);
        header.appendChild(monthYear);
        header.appendChild(nextButton);

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Day names header (Mon-Sun)
        const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        days.forEach(day => {
            const dayName = document.createElement('div');
            dayName.className = 'calendar-day-name';
            dayName.textContent = day;
            grid.appendChild(dayName);
        });

        // Days of the month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Adjust for weeks starting on Monday (0=Sun, 1=Mon, ..., 6=Sat)
        let dayOfWeek = firstDayOfMonth.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday 7
        const startOffset = dayOfWeek - 1;

        for (let i = 0; i < startOffset; i++) {
            grid.appendChild(document.createElement('div')); // Empty cells for padding
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayCell.classList.add('today');
            }

            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const prefix = `${year}${monthStr}${dayStr}`;
            const dayEvents = cachedEvents.filter(e => e.start && e.start.startsWith(prefix));
            
            if (dayEvents.length > 0) {
                dayCell.classList.add('has-event');
                dayCell.title = dayEvents.map(e => e.summary).join('\n');
            }

            dayCell.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent widget-level click
                const y = year;
                const m = month + 1; // Google Calendar uses 1-based month
                const d = day;
                const url = `https://calendar.google.com/calendar/r/day/${y}/${m}/${d}`;
                window.open(url, '_self');
            })
            grid.appendChild(dayCell);
        }

        calendarContainer.appendChild(header);
        calendarContainer.appendChild(grid);
    };

    widgetWrapper.appendChild(calendarContainer);
    
    if (settings && settings.icalUrl) {
        fetch(settings.icalUrl)
            .then(r => r.text())
            .then(text => {
                cachedEvents = parseICS(text);
                updateCalendar();
            }).catch(e => {
                console.error("Error fetching ICS:", e);
                updateCalendar();
            });
    } else {
        updateCalendar(); // Initial render
    }
    
    return widgetWrapper;
}
