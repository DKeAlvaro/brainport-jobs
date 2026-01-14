/**
 * Brainport Jobs Visualizer - Core Logic
 * High-performance spreadsheet-like explorer
 */

(function () {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const stats = document.getElementById('stats');
    const exportBtn = document.getElementById('exportBtn');

    // State management
    let jobs = [];
    let filteredJobs = [];

    /**
     * Renders the job table based on a filtered list
     * @param {Array} data 
     */
    function render(data) {
        filteredJobs = data;
        const html = data.map(job => `
            <tr>
                <td title="${job.title || ''}">${job.title || ''}</td>
                <td title="${job.company || ''}">${job.company || ''}</td>
                <td title="${job.location || ''}">${job.location || ''}</td>
                <td title="${job.description || ''}">${job.description || ''}</td>
                <td>${job.date || ''}</td>
                <td><a href="${job.url || '#'}" target="_blank" class="btn-view">View</a></td>
            </tr>
        `).join('');

        tableBody.innerHTML = html;
        const lastUpdated = document.body.getAttribute('data-last-updated') || 'Unknown';
        stats.textContent = `Showing ${data.length} of ${jobs.length} jobs (Updated: ${lastUpdated})`;
    }

    /**
     * Efficient search function
     */
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();

        if (!query) {
            render(jobs);
            return;
        }

        const filtered = jobs.filter(job => {
            // Check major fields for matches
            return (
                (job.title && job.title.toLowerCase().includes(query)) ||
                (job.company && job.company.toLowerCase().includes(query)) ||
                (job.location && job.location.toLowerCase().includes(query)) ||
                (job.description && job.description.toLowerCase().includes(query))
            );
        });

        render(filtered);
    }

    /**
     * Converts current data to CSV and triggers download
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

    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    exportBtn.addEventListener('click', exportToCSV);

    // Initial load
    // Initial load
    fetch('jobs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            jobs = data.jobs || [];
            const lastUpdated = data.last_updated || 'Unknown';
            document.body.setAttribute('data-last-updated', lastUpdated);

            // Update stats immediately if needed, or let render handle it
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
