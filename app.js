/**
 * Brainport Jobs Visualizer - Core Logic
 * Optimized with debounced search + content-visibility on rows
 */

(function () {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const stats = document.getElementById('stats');
    const exportBtn = document.getElementById('exportBtn');
    const tableContainer = document.querySelector('.table-container');

    // State
    let jobs = [];
    let filteredJobs = [];
    let lastUpdated = 'Unknown';

    const tooltipEl = document.getElementById('tooltip');
    let tooltipTimeout = null;

    /**
     * Escape HTML special chars in a string
     */
    function esc(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Renders the job table. Each row gets content-visibility: auto
     * so off-screen rows are skipped during layout/paint.
     */
    function render(data) {
        filteredJobs = data;

        let html = '';
        for (let i = 0; i < data.length; i++) {
            const job = data[i];
            html += `<tr style="content-visibility:auto; contain-intrinsic-size:37px;">
                <td>${esc(job.title)}</td>
                <td>${esc(job.company)}</td>
                <td>${esc(job.location)}</td>
                <td>${esc(job.description)}</td>
                <td>${esc(job.date)}</td>
                <td><a href="${esc(job.url) || '#'}" target="_blank" class="btn-view">View</a></td>
            </tr>`;
        }

        tableBody.innerHTML = html;
        stats.textContent = `Showing ${data.length} of ${jobs.length} jobs (Updated: ${lastUpdated})`;
    }

    /**
     * Debounced search — waits 200ms after typing stops
     */
    let searchTimeout = null;
    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.toLowerCase().trim();

            if (!query) {
                render(jobs);
                return;
            }

            const filtered = jobs.filter(job =>
                (job.title && job.title.toLowerCase().includes(query)) ||
                (job.company && job.company.toLowerCase().includes(query)) ||
                (job.location && job.location.toLowerCase().includes(query)) ||
                (job.description && job.description.toLowerCase().includes(query))
            );

            render(filtered);
        }, 200);
    }

    /**
     * Export to CSV
     */
    function exportToCSV() {
        if (filteredJobs.length === 0) return;

        const headers = ["Title", "Company", "Location", "Description", "Date", "URL"];
        const rows = filteredJobs.map(job => [
            job.title || '',
            job.company || '',
            job.location || '',
            job.description || '',
            job.date || '',
            job.url || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `brainport_jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Tooltip: show on hover for overflowing cells ---
    let hoveredCell = null;

    function onMouseOver(e) {
        const td = e.target.closest('td');
        if (!td || td === hoveredCell) return;

        // Skip the link column (last cell in row)
        const row = td.closest('tr');
        if (!row || td.cellIndex === row.cells.length - 1) {
            hideTooltipNow();
            hoveredCell = td;
            return;
        }

        hoveredCell = td;

        // Only show if content is truncated
        if (td.scrollWidth <= td.clientWidth) {
            hideTooltipNow();
            return;
        }

        clearTimeout(tooltipTimeout);

        const rect = td.getBoundingClientRect();
        tooltipEl.textContent = td.textContent;
        tooltipEl.classList.add('visible');

        // Position below cell, or above if near bottom
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow > 250) {
            tooltipEl.style.top = (rect.bottom + 6) + 'px';
        } else {
            const ttH = tooltipEl.offsetHeight || 80;
            tooltipEl.style.top = Math.max(4, rect.top - 6 - ttH) + 'px';
        }
        tooltipEl.style.left = Math.min(rect.left, window.innerWidth - tooltipEl.offsetWidth - 8) + 'px';
    }

    function onMouseOut(e) {
        const related = e.relatedTarget;
        // If moving to another cell in the same table, don't hide yet
        if (related && tableBody.contains(related)) return;
        hideTooltipNow();
        hoveredCell = null;
    }

    function hideTooltipNow() {
        clearTimeout(tooltipTimeout);
        tooltipEl.classList.remove('visible');
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', handleSearch);
    exportBtn.addEventListener('click', exportToCSV);
    tableBody.addEventListener('mouseover', onMouseOver);
    tableBody.addEventListener('mouseout', onMouseOut);
    // Hide tooltip when scrolling
    tableContainer.addEventListener('scroll', hideTooltipNow);

    // --- Initial Load ---
    fetch('jobs.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            jobs = data.jobs || [];
            lastUpdated = data.last_updated || 'Unknown';
            document.body.setAttribute('data-last-updated', lastUpdated);

            if (document.getElementById('lastUpdatedMobile')) {
                document.getElementById('lastUpdatedMobile').textContent = `Updated: ${lastUpdated}`;
            }

            render(jobs);
        })
        .catch(error => {
            console.error("Error loading jobs.json:", error);
            stats.textContent = "Error: Job data not found (jobs.json).";
        });

})();
