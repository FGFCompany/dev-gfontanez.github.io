document.addEventListener("DOMContentLoaded", function () {
    // Función para establecer una cookie sin expiración
    function setCookie(name, value) {
        document.cookie = name + "=" + value + ";path=/";
    }

    // Función para obtener una cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Comprobar si la cookie de sesión existe
    let sessionID = getCookie("sessionID");

    if (!sessionID) {
        // No hay cookie de sesión, crear una nueva
        sessionID = Math.random().toString(36).substring(2);  // Generar un ID de sesión aleatorio
        setCookie("sessionID", sessionID);  // Establecer la cookie de sesión sin expiración
    } else {
        // La cookie de sesión existe, continuar usándola
        console.log("ID existente:", sessionID);
    }

    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');

    // Cargar y mostrar los registros al cargar la página
    loadRecords();

    async function loadRecords() {
        const { data: records, error } = await database
            .from('ticket')
            .select('*')
            .eq('sessionID', sessionID)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching data from Supabase:', error);
        } else {
            // Iterar sobre los registros en la tabla
            if (records.length > 0) {
                // Insertar los registros en la tabla
                records.forEach(record => {
                    insertRecordData(record.fullName, record.priority, record.subject, record.description);
                });
            }
        }
    }

    function insertRecordData(fullName, priority, subject, description) {
        const tableBody = document.getElementById('newTicket');

        // Remove "No data available" row if it exists
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) {
            noDataRow.remove();
        }

        // Create new row with record data
        const newRow = document.createElement('tr');

        const fullNameCell = document.createElement('td');
        fullNameCell.textContent = fullName;
        fullNameCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const priorityCell = document.createElement('td');
        priorityCell.textContent = priority;
        priorityCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const subjectCell = document.createElement('td');
        subjectCell.textContent = subject;
        subjectCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = description;
        descriptionCell.classList.add('px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');

        newRow.appendChild(fullNameCell);
        newRow.appendChild(priorityCell);
        newRow.appendChild(subjectCell);
        newRow.appendChild(descriptionCell);

        tableBody.appendChild(newRow);
    }

    document.getElementById('saveNewTicket').addEventListener('click', onSaveNewTicket);

    async function onSaveNewTicket(event) {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const priority = document.getElementById('priority').value;
        const subject = document.getElementById('subject').value;
        const description = document.getElementById('description').value;

        // Verificar si los campos no están vacíos
        if (fullName && priority && subject && description) {
            await insertDataToSupabase(fullName, priority, subject, description, sessionID);
        } else {
            console.error('Todos los campos deben ser completados.');
        }
    }

    async function insertDataToSupabase(fullName, priority, subject, description, sessionID) {
        const { data: insertedData, error } = await database
            .from('ticket')
            .insert([
                {
                    fullName: fullName,
                    priority: priority,
                    subject: subject,
                    description: description,
                    sessionID: sessionID
                }
            ])
            .select('*');

        if (error) {
            console.error('Error inserting data into Supabase:', error);
        } else {
            if (insertedData.length > 0) {
                const insertedRecord = insertedData[0];
                insertRecordData(insertedRecord.fullName, insertedRecord.priority, insertedRecord.subject, insertedRecord.description);
                document.querySelector('[data-modal-hide="static-modal"]').click();
            }
        }
    }
});
