document.addEventListener("DOMContentLoaded", function () {
    // Función para establecer una cookie sin expiración
    function setCookie(name, value) {
        document.cookie = name + "=" + value + ";path=/";
    }

    // Función para obtener una cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
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
    // DB SupaBase API
    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');


    // Función para agregar la fila de "No data available"
    function addNoDataRow() {
        const tableBody = document.getElementById('tbobyTicket');
        const newRow = document.createElement('tr');
        newRow.id = 'noDataRow';
        const newCell = document.createElement('td');
        newCell.classList.add('px-6', 'py-5', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        newCell.textContent = 'No data available';
        newCell.setAttribute('colspan', '4'); // Para que la celda ocupe todas las columnas de la tabla
        newRow.appendChild(newCell);
        tableBody.appendChild(newRow);
    }

    // Cargar y mostrar los registros al cargar la página
    loadRecords();

    async function loadRecords() {
        const { data: records, error } = await database
            .from('ticket')
            .select('*')
            .eq('sessionID', sessionID)
            .order('created_at', { ascending: true })
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
            } else {
                addNoDataRow();
            }
        }
    }

    function insertRecordData(fullName, priority, subject, description) {
        const tableBody = document.getElementById('tbobyTicket');

        // Eliminar la fila de "No data available" si existe
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) {
            noDataRow.remove();
        }

        // Create new row with record data
        const newRow = document.createElement('tr');
        // Create cells for each column
        const fullNameCell = document.createElement('td');
        fullNameCell.textContent = fullName;
        fullNameCell.classList.add('fullnameSelect', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        fullNameCell.style.maxWidth = '80px';
        fullNameCell.style.overflow = 'hidden';
        fullNameCell.style.textOverflow = 'ellipsis';

        const subjectCell = document.createElement('td');
        const subjectLink = document.createElement('a');
        subjectLink.textContent = subject;
        subjectLink.classList.add('subjectSelect', 'hover:underline', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-sky-500', 'dark:text-sky-400');
        subjectCell.appendChild(subjectLink);
        subjectCell.style.maxWidth = '50px';
        subjectCell.style.overflow = 'hidden';
        subjectCell.style.textOverflow = 'ellipsis';

        const priorityCell = document.createElement('td');
        priorityCell.textContent = priority;
        priorityCell.classList.add('prioritySelect', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        priorityCell.style.maxWidth = '80px';
        priorityCell.style.overflow = 'hidden';
        priorityCell.style.textOverflow = 'ellipsis';
        
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = description;
        descriptionCell.classList.add('descriptionSelect', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        descriptionCell.style.maxWidth = '100px';
        descriptionCell.style.overflow = 'hidden';
        descriptionCell.style.textOverflow = 'ellipsis';

        newRow.appendChild(fullNameCell);
        newRow.appendChild(subjectCell);
        newRow.appendChild(priorityCell);
        newRow.appendChild(descriptionCell);

        tableBody.appendChild(newRow);
        addRowClickListeners()
    }

    // Función para agregar eventos de clic a las filas de la tabla
    function addRowClickListeners() {
        document.querySelectorAll('tr').forEach(row => {
            // Remover cualquier evento de clic existente
            row.removeEventListener('click', handleRowClick);

            // Agregar el nuevo evento de clic
            row.addEventListener('click', handleRowClick);
        });
    }

    // Función manejadora del evento de clic en las filas
    function handleRowClick(event) {
        selectedRow = event.currentTarget; // Guardar la fila seleccionada

        // Obtener la data de la fila seleccionada
        const fullnameSelect = selectedRow.querySelector('.fullnameSelect').innerText;
        const priority = selectedRow.querySelector('.prioritySelect').innerText;
        const description = selectedRow.querySelector('.descriptionSelect').innerText;
        const subject = selectedRow.querySelector('.subjectSelect').innerText;

        // Mostrar el modal con id "static-modal"
        const modal = document.getElementById('static-modal');
        modal.style.display = 'flex';
        const disableSubject = document.getElementById('subject');
        disableSubject.setAttribute('readonly', true);
        disableSubject.classList.add('opacity-50');
        const saveNewTicket = document.getElementById('saveNewTicket');
        saveNewTicket.classList.add('hidden');
        const updateNewTicket = document.getElementById('updateNewTicket');
        updateNewTicket.classList.remove('hidden');
        document.getElementById('fullName').value = fullnameSelect;
        document.getElementById('priority').value = priority;
        document.getElementById('subject').value = subject;
        document.getElementById('description').value = description;

        // Cerrar el modal al hacer clic en cualquier lugar de la pantalla
        const closeBtn = document.getElementById('closeBtn');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    // Funcion para abrir y cerrar el modal
    document.getElementById('openNewTicket').addEventListener('click', onOpenNewTicket);
    async function onOpenNewTicket(event) {
        event.preventDefault();
        const modal = document.getElementById('static-modal');
        modal.style.display = 'flex';
        const saveNewTicket = document.getElementById('saveNewTicket');
        saveNewTicket.classList.remove('hidden');
        const updateNewTicket = document.getElementById('updateNewTicket');
        updateNewTicket.classList.add('hidden');
        const enableSubject = document.getElementById('subject');
        enableSubject.removeAttribute('readonly');
        enableSubject.classList.remove('opacity-50');
        clearFormFields();
        // Cerrar el modal al hacer clic en cualquier lugar de la pantalla
        const closeBtn = document.getElementById('closeBtn');
        closeBtn.addEventListener('click', async () => {
            modal.style.display = 'none';
        });
    }
    // Funcion para validar y llamar función para insertar datos
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
    // Funcion para insertar datos
    async function insertDataToSupabase(fullName, priority, subject, description, sessionID) {
        try {
            const { data: insertedData, error } = await database
                .from('ticket')
                .insert([{ fullName, priority, subject, description, sessionID }])
                .select('*');

            if (error) throw error;

            if (insertedData.length > 0) {
                const insertedRecord = insertedData[0];
                insertRecordData(insertedRecord.fullName, insertedRecord.priority, insertedRecord.subject, insertedRecord.description);
                clearFormFields();
                document.querySelector('[data-modal-hide="static-modal"]').click();
            }
        } catch (error) {
            console.error('Error inserting data into Supabase:', error);
        }
    }

    function clearFormFields() {
        document.getElementById('fullName').value = "";
        document.getElementById('priority').value = "Normal";
        document.getElementById('subject').value = "";
        document.getElementById('description').value = "";
    }

    document.getElementById("updateNewTicket").addEventListener("click", function () {
        const fullName = document.getElementById("fullName").value;
        const priority = document.getElementById("priority").value;
        const subject = document.getElementById("subject").value;
        const description = document.getElementById("description").value;
        updateTicketDataToSupabase(fullName, priority, subject, description);
    });

    async function updateTicketDataToSupabase(fullName, priority, subject, description) {
        const { data: updatedData, error } = await database
            .from('ticket')
            .update({ fullName, priority, description })
            .eq('subject', subject);
        if (error) {
            console.error('Error updating data in Supabase:', error);
        } else {
            // Cerrar el modal
            document.querySelector('[data-modal-hide="static-modal"]').click();
        }
    }

    // Función para suscribirse a los cambios en tiempo real de la tabla "ticket"
    function subscribeToRealtimeUpdates() {
        database
            .channel('public:ticket')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket' }, payload => {
                const record = payload.new;
                // Actualizar la tabla HTML basada en los cambios en tiempo real
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                    const subjectCell = row.querySelector('.subjectSelect');
                    if (subjectCell && subjectCell.innerText === record.subject) {
                        row.querySelector('.fullnameSelect').innerText = record.fullName;
                        row.querySelector('.prioritySelect').innerText = record.priority;
                        row.querySelector('.descriptionSelect').innerText = record.description;
                    }
                });
            })
            .subscribe();
    }

    // Llamar a la función para suscribirse a las actualizaciones en tiempo real
    subscribeToRealtimeUpdates();

});

