document.addEventListener("DOMContentLoaded", function () {
    // DB SupaBase API
    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');

    // Call the functions to load the information
    loadUsersTracking();
    loadUsersTicket();

    // Load the information from the database when the page loads
    async function loadUsersTracking() {
        const { data: usersTrackingData, error } = await database
            .rpc('get_unique_tempuserstracking');
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', usersTrackingData);
            selectUsersTracking(usersTrackingData);
        }
    }
    // Populate the select with the retrieved information
    function selectUsersTracking(usersTrackingData) {
        const usersTrackingSelect = document.getElementById('usersTracking');
        // Create select options
        usersTrackingData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.tempuser;
            option.textContent = 'TEMP-User: ' + '"' + item.tempuser + '"';
            usersTrackingSelect.appendChild(option);
        });
    }



    async function loadUsersTicket() {
        const { data: userTicketData, error } = await database
            .rpc('get_unique_tempusersticket');
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', userTicketData);
            selectUsersTicket(userTicketData);
        }
    }


    function selectUsersTicket(userTicketData) {
        const usersTicketSelect = document.getElementById('usersTicket');
        // Create select options
        userTicketData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.tempuser;
            option.textContent = 'TEMP-User: ' + '"' + item.tempuser + '"';
            usersTicketSelect.appendChild(option);
        });
    }



    // Event listener for the change event on the select element Tracking
    document.getElementById('usersTracking').addEventListener('change', function () {
        const tempuser = this.value;
        loadUsersTrackingTable(tempuser);
    });
    // Event listener for the change event on the select element Ticket
    document.getElementById('usersTicket').addEventListener('change', function () {
        const tempuser = this.value;
        loadUsersTicketTable(tempuser);
    })




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
                const newRow = document.createElement('tr');
                newRow.classList.add('odd:bg-white', 'odd:dark:bg-gray-900', 'even:bg-gray-100', 'even:dark:bg-gray-800');

                const vehicleCell = document.createElement('td');
                vehicleCell.textContent = loadUser[i].vehicle;
                vehicleCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const positionGeocodedCell = document.createElement('td');
                positionGeocodedCell.textContent = loadUser[i].positionGeocoded;
                positionGeocodedCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const speedCell = document.createElement('td');
                speedCell.textContent = loadUser[i].speed;
                speedCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

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

                // Append the cells to the row
                newRow.appendChild(vehicleCell);
                newRow.appendChild(positionGeocodedCell);
                newRow.appendChild(speedCell);
                newRow.appendChild(timestampCell);
                trackingReportData.appendChild(newRow);
            }
        }
    }

    // Function to load the table data
    async function loadUsersTicketTable(tempuser) {
        const { data: loadUser, error } = await database
            .from('ticket')
            .select('*')
            .eq('tempuser', tempuser);
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', loadUser);
            const ticketReportData = document.getElementById('ticketReportData');
            // Create table rows
            ticketReportData.innerHTML = ''; // Clear previous NO Found data html template
            for (let i = 0; i < loadUser.length; i++) {
                const newRow = document.createElement('tr');
                newRow.classList.add('odd:bg-white', 'odd:dark:bg-gray-900', 'even:bg-gray-100', 'even:dark:bg-gray-800');

                const fullNameCell = document.createElement('td');
                fullNameCell.textContent = loadUser[i].fullName;
                fullNameCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const priorityCell = document.createElement('td');
                priorityCell.textContent = loadUser[i].priority;
                priorityCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const subjectCell = document.createElement('td');
                subjectCell.textContent = loadUser[i].subject;
                subjectCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const descriptionCell = document.createElement('td');
                descriptionCell.textContent = loadUser[i].description;
                descriptionCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                const idCell = document.createElement('td');
                idCell.textContent = loadUser[i].id;
                idCell.classList.add('hidden', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

                newRow.appendChild(fullNameCell);
                newRow.appendChild(subjectCell);
                newRow.appendChild(priorityCell);
                newRow.appendChild(descriptionCell);
                newRow.appendChild(idCell);
                ticketReportData.appendChild(newRow);
            }
        }
    }


});