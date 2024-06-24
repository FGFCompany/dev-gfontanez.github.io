document.addEventListener("DOMContentLoaded", function () {
    // DB SupaBase API
    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');


    // Load the information from the database when the page loads
    async function loadUsersTracking() {
        const { data, error } = await database
            .rpc('get_unique_tempuserstracking');
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', data);
            selectUsersTracking(data);
        }
    }
    // Populate the select with the retrieved information
    function selectUsersTracking(data) {
        const usersTrackingSelect = document.getElementById('usersTracking');
        // Create select options
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.tempuser;
            option.textContent = 'TEMP-User: ' + '"' + item.tempuser + '"';
            usersTrackingSelect.appendChild(option);
        });
    }
    // Call the function to load the information
    loadUsersTracking();


async function loadUsersTicket() {
    const { data: loadUserTicket, error } = await database
    .rpc('get_unique_tempuserstickets');
}

    // Event listener for the change event on the select element Tracking
    document.getElementById('usersTracking').addEventListener('change', function() {
        const tempuser = this.value;
        loadUsersTrackingTable(tempuser);
    });
    // Function to load the table data
    async function loadUsersTrackingTable(tempuser) {
        const { data: loadUser, error } = await database
            .from('tracking')
            .select('*')
            .eq('tempuser', tempuser);
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', loadUser);
            const trackingReportData = document.getElementById('trackingReportData');
            // Create table rows
            trackingReportData.innerHTML = ''; // Clear previous NO Found data html template
            for (let i = 0; i < loadUser.length; i++) {
                const row = document.createElement('tr');
                const styles = ['dark:bg-gray-900', 'dark:bg-gray-800']; // array of styles
                const style = styles[i % styles.length]; // get the style based on the index
                row.classList.add(style);
                const vehicleCell = document.createElement('td');
                vehicleCell.textContent = loadUser[i].vehicle;
                vehicleCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                row.appendChild(vehicleCell);
                const positionGeocodedCell = document.createElement('td');
                positionGeocodedCell.textContent = loadUser[i].positionGeocoded;
                positionGeocodedCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                row.appendChild(positionGeocodedCell);
                const speedCell = document.createElement('td');
                speedCell.textContent = loadUser[i].speed;
                speedCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                row.appendChild(speedCell);
                const timestampCell = document.createElement('td');
                const date = new Date(loadUser[i].created_at);
                timestampCell.textContent = date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                timestampCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                row.appendChild(timestampCell);
                trackingReportData.appendChild(row);
            }
        }
    }

    // document.getElementById('ticketReportData').addEventListener('change', function() {
    //     const tempuser = this.value;
    // })


});