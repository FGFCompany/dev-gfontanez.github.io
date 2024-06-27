document.addEventListener("DOMContentLoaded", function () {
    // Función para establecer una cookie con una fecha de expiración
    function setCookie(name, value, expirationDays) {
        const date = new Date();
        date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
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
    let expirationDays = 180; // 6 meses en días
    let sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (!sessionID || new Date(sessionID) < sixMonthsAgo) {
        // No hay cookie de sesión o ya pasaron 6 meses, crear una nueva
        sessionID = Math.random().toString(36).substring(2);  // Generar un ID de sesión aleatorio
        setCookie("sessionID", sessionID, expirationDays);  // Establecer la cookie de sesión con una fecha de expiración
        fetchSelectedVehicleLocation(sessionID);
    } else {
        // La cookie de sesión existe y aún no pasaron 6 meses, continuar usándola
        console.log("ID existente:", sessionID);
    }


    // DB SupaBase API
    const database = supabase.createClient('https://svdtdtpqscizmxlcicox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZHRkdHBxc2Npem14bGNpY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2NTU2ODEsImV4cCI6MjAzMjIzMTY4MX0.9Hkev2jhj11Q6r6DXrf2gpixaVTDj2vODRYwpxB5Y50');


    // Cargar y mostrar los registros al cargar la página
    loadTableRecords();

    async function loadTableRecords() {
        const { data: records, error } = await database
            .from('ticket')
            .select('*')
            .eq('tempuser', sessionID)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching data from Supabase:', error);
        } else {
            // Iterar sobre los registros en la tabla
            if (records.length > 0) {
                // Insertar los registros en la tabla
                records.forEach(loadRecord => {
                    addDataRow(loadRecord.fullName, loadRecord.priority, loadRecord.subject, loadRecord.description, loadRecord.id);
                });
            } else {
                addNODataRow();
            }
        }
    }

    // Función para agregar la fila de "No data available"
    function addNODataRow() {
        const tableBody = document.getElementById('tbobyTicketTable');
        const newRow = document.createElement('tr');
        newRow.id = 'noDataRow';
        const newCell = document.createElement('td');
        newCell.classList.add('px-6', 'py-5', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        newCell.textContent = 'No data available';
        newCell.setAttribute('colspan', '4'); // Para que la celda ocupe todas las columnas de la tabla
        newRow.appendChild(newCell);
        tableBody.appendChild(newRow);
    }

    // Función para insertar datos a la tabla
    function addDataRow(fullName, priority, subject, description, id) {
        const tableBody = document.getElementById('tbobyTicketTable');
        // Eliminar la fila de "No data available" si existe
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) {
            noDataRow.remove();
        }

        // Create new row with record data
        const newRow = document.createElement('tr');
        newRow.classList.add('odd:bg-white', 'odd:dark:bg-gray-900', 'even:bg-gray-100', 'even:dark:bg-gray-800');

        // Create cells for each column
        const fullNameCell = document.createElement('td');
        fullNameCell.textContent = fullName;
        fullNameCell.classList.add('fullnameSelect', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        fullNameCell.style.maxWidth = '150px';
        fullNameCell.style.overflow = 'hidden';
        fullNameCell.style.textOverflow = 'ellipsis';

        const subjectCell = document.createElement('td');
        const subjectLink = document.createElement('a');
        subjectLink.textContent = subject;
        subjectLink.classList.add('subjectSelect', 'hover:underline', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-sky-500', 'dark:text-sky-400');
        subjectCell.appendChild(subjectLink);
        subjectCell.style.maxWidth = '150px';
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

        const idCell = document.createElement('td');
        idCell.value = id;
        idCell.classList.add('idSelect', 'hidden', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
        idCell.style.maxWidth = '100px';
        idCell.style.overflow = 'hidden';
        idCell.style.textOverflow = 'ellipsis';

        newRow.appendChild(fullNameCell);
        newRow.appendChild(subjectCell);
        newRow.appendChild(priorityCell);
        newRow.appendChild(descriptionCell);
        newRow.appendChild(idCell);


        tableBody.appendChild(newRow);
        addRowClickListeners()
    }

    // Función para agregar eventos de click a las filas de la tabla
    function addRowClickListeners() {
        document.querySelectorAll('#tbobyTicketTable tr').forEach(row => {
            // Remover cualquier evento de click existente
            row.removeEventListener('click', rowTicketSelected);

            // Agregar el nuevo evento de click
            row.addEventListener('click', rowTicketSelected);
        });
        // Agregar eventos de sort click a los encabezados para ordenar las columnas
        document.querySelectorAll('th a').forEach(header => {
            header.addEventListener('click', function (e) {
                e.preventDefault();
                const table = header.closest('table');
                const index = Array.from(header.closest('tr').children).indexOf(header.closest('th'));
                const order = header.dataset.order = -(header.dataset.order || -1);
                const rows = Array.from(table.querySelector('tbody').rows);

                rows.sort((rowA, rowB) => {
                    const cellA = rowA.cells[index].innerText;
                    const cellB = rowB.cells[index].innerText;
                    return (cellA > cellB ? 1 : cellA < cellB ? -1 : 0) * order;
                });

                table.querySelector('tbody').innerHTML = '';
                rows.forEach(row => {
                    table.querySelector('tbody').appendChild(row);
                });
            });
        });
    }

    // Función manejadora del evento de clic en las filas
    function rowTicketSelected(event) {
        selectedRow = event.currentTarget; // Guardar la fila seleccionada
        // Obtener la data de la fila seleccionada
        const fullnameSelect = selectedRow.querySelector('.fullnameSelect').innerText;
        const prioritySelect = selectedRow.querySelector('.prioritySelect').innerText;
        const subjectSelect = selectedRow.querySelector('.subjectSelect').innerText;
        const descriptionSelect = selectedRow.querySelector('.descriptionSelect').innerText;
        const idSelect = selectedRow.querySelector('.idSelect').value;
        // Mostrar el modal con id "static-modal"
        const modal = document.getElementById('static-modal');
        modal.style.display = 'flex';
        document.getElementById('modalTitle').innerText = 'Ticket-' + idSelect;
        const commentSection = document.getElementById('commentSection');
        commentSection.classList.remove('hidden');
        const saveNewTicket = document.getElementById('saveNewTicket');
        saveNewTicket.classList.add('hidden');
        const downloadTicketPdfBtn = document.getElementById('downloadTicketPdfBtn');
        downloadTicketPdfBtn.classList.remove('hidden');
        downloadTicketPdfBtn.classList.add('inline-flex');
        const updateNewTicket = document.getElementById('updateNewTicket');
        updateNewTicket.classList.remove('hidden');
        // Convertir los innerText a values de los campos
        document.getElementById('fullName').value = fullnameSelect;
        document.getElementById('priority').value = prioritySelect;
        document.getElementById('subject').value = subjectSelect;
        document.getElementById('description').value = descriptionSelect;
        // Cargar los comentarios
        loadComments(idSelect);
        // Cerrar el modal al hacer clic en cualquier lugar de la pantalla
        const closeBtn = document.getElementById('closeBtn');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    async function loadComments(ticketId) {
        const { data: ticketWithComments, error } = await database
            .from('ticket')
            .select('comments')
            .eq('id', ticketId);

        if (error) {
            console.error('Error fetching ticket with comments:', error);
        } else {
            // Mostrar los comentarios en el modal
            const commentSection = document.getElementById('readcomments');
            commentSection.innerHTML = ''; // Limpiar comentarios anteriores
            commentSection.classList.add('w-full', 'p-1', 'rounded', 'bg-gray-200', 'dark:bg-gray-700', 'pointer-events-none');

            if (ticketWithComments.length > 0 && ticketWithComments[0].comments !== null && ticketWithComments[0].comments !== " ") {
                const comments = ticketWithComments[0].comments;
                if (comments.length > 0) {
                    const commentList = document.createElement('ul');
                    comments.forEach(comment => {
                        const commentItem = document.createElement('li');
                        commentItem.textContent = comment;
                        commentItem.classList.add('bg-slate-300', 'dark:bg-slate-600', 'rounded', 'm-2', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                        commentList.appendChild(commentItem);
                    });
                    commentSection.appendChild(commentList);
                } else {
                    const noCommentsMsg = document.createElement('div');
                    noCommentsMsg.textContent = 'No Comments';
                    noCommentsMsg.classList.add('bg-slate-300', 'dark:bg-slate-600', 'rounded', 'm-2', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                    commentSection.appendChild(noCommentsMsg);
                }
            } else {
                const noCommentsMsg = document.createElement('div');
                noCommentsMsg.textContent = 'No Comments';
                noCommentsMsg.classList.add('bg-slate-300', 'dark:bg-slate-600', 'rounded', 'm-2', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                commentSection.appendChild(noCommentsMsg);
            }
        }
    }


    // Funcion para abrir y cerrar el modal en New Ticket
    document.getElementById('openNewTicket').addEventListener('click', onOpenNewTicket);
    async function onOpenNewTicket(event) {
        event.preventDefault();
        const modal = document.getElementById('static-modal');
        modal.style.display = 'flex';
        document.getElementById('modalTitle').innerText = 'New Ticket';
        const commentSection = document.getElementById('commentSection');
        commentSection.classList.add('hidden');
        const downloadTicketPdfBtn = document.getElementById('downloadTicketPdfBtn');
        downloadTicketPdfBtn.classList.add('hidden');
        downloadTicketPdfBtn.classList.remove('inline-flex');
        const saveNewTicket = document.getElementById('saveNewTicket');
        saveNewTicket.classList.remove('hidden');
        const updateNewTicket = document.getElementById('updateNewTicket');
        updateNewTicket.classList.add('hidden');
        // Resetear el formulario
        document.getElementById('ticketForm').reset();
        // Cerrar el modal al hacer clic en cualquier lugar de la pantalla
        const closeBtn = document.getElementById('closeBtn');
        closeBtn.addEventListener('click', async () => {
            modal.style.display = 'none';
        });
    }

    document.getElementById('saveNewTicket').addEventListener('click', onSaveNewTicket);
    async function onSaveNewTicket(event) {
        event.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const priority = document.getElementById('priority').value;
        const subject = document.getElementById('subject').value;
        const description = document.getElementById('description').value;
        // Verificar si los campos no están vacíos
        if (!fullName || !priority || !subject || !description) {
            console.error('Todos los campos deben ser completados.');
            return;
        }
        try {
            const { data: insertedData, error } = await database
                .from('ticket')
                .insert([
                    {
                        fullName: fullName,
                        priority: priority,
                        subject: subject,
                        description: description,
                        tempuser: sessionID
                    }
                ])
                .select('*');

            if (error) {
                throw error;
            }

            if (insertedData.length > 0) {
                const insertedRecord = insertedData[0];
                addDataRow(insertedRecord.fullName, insertedRecord.priority, insertedRecord.subject, insertedRecord.description, insertedRecord.id);
                // Resetear el formulario
                document.getElementById('ticketForm').reset();
                document.querySelector('[data-modal-hide="static-modal"]').click();
            } else {
                console.error('Error al insertar el registro.');
            }
        } catch (err) {
            console.error('Error al insertar el registro:', err.message);
        }
    }


    // Funcion para validar y llamar función para actualizar datos en el boton Save Changes
    document.getElementById("updateNewTicket").addEventListener("click", onUpdateTicket);
    async function onUpdateTicket(event) {
        event.preventDefault();
        const fullName = document.getElementById("fullName").value;
        const priority = document.getElementById("priority").value;
        const subject = document.getElementById("subject").value;
        const description = document.getElementById("description").value;
        const id = selectedRow.querySelector('.idSelect').value;
        // Primero, obtenemos el array de comentarios actual
        const { data: updatedData, error } = await database
            .from('ticket')
            .update({ fullName, priority, subject, description })
            .eq('id', id);
        if (error) {
            console.error('Error updating data in Supabase:', error);
        } else {
            // Cerrar el modal
            document.querySelector('[data-modal-hide="static-modal"]').click();
        }
    };


    // Funcion para agregar un nuevo comentario
    document.getElementById("addComment").addEventListener("click", onAddComment);
    async function onAddComment(event) {
        event.preventDefault();
        const comment = document.getElementById("comments").value;
        const id = selectedRow.querySelector('.idSelect').value;
        // Primero, obtenemos el array de comentarios actual
        const { data: currentCommentsData, error } = await database
            .from('ticket')
            .select('comments')
            .eq('id', id);
        if (error) {
            console.error('Error fetching current comments:', error);
        } else {
            const currentComments = currentCommentsData[0]?.comments || [];
            const updatedComments = [...currentComments, comment];
            const { data: updatedData, error } = await database
                .from('ticket')
                .update({ comments: updatedComments })
                .eq('id', id);
            if (error) {
                console.error('Error updating comments in Supabase:', error);
            } else {
                document.getElementById("comments").value = "";
            }
        }
    };


    // Función para suscribirse a los cambios en tiempo real de la tabla "ticket"
    async function subscribeToRealtimeUpdates() {
        const { error } = await database
            .channel('public:ticket')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket' }, payload => {
                const subscribeRecord = payload.new;
                const readcomments = document.getElementById('readcomments');
                // Actualizar la tabla HTML basada en los cambios en tiempo real
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                    const idCell = row.querySelector('.idSelect');
                    if (idCell && idCell.value === subscribeRecord.id) {
                        row.querySelector('.fullnameSelect').innerText = subscribeRecord.fullName;
                        row.querySelector('.subjectSelect').innerText = subscribeRecord.subject;
                        row.querySelector('.prioritySelect').innerText = subscribeRecord.priority;
                        row.querySelector('.descriptionSelect').innerText = subscribeRecord.description;

                        // Crear nuevas filas para los comentarios
                        if (subscribeRecord.comments && Array.isArray(subscribeRecord.comments)) {
                            readcomments.innerHTML = '';
                            const commentList = document.createElement('ul');
                            commentList.classList.add('w-full', 'rounded', 'bg-gray-200', 'dark:bg-gray-700', 'pointer-events-none');
                            subscribeRecord.comments.forEach(comment => {
                                const commentItem = document.createElement('li');
                                commentItem.textContent = comment;
                                commentItem.classList.add('bg-slate-300', 'dark:bg-slate-600', 'rounded', 'm-2', 'truncate', 'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-900', 'dark:text-white');
                                commentList.appendChild(commentItem);
                            });
                            readcomments.innerHTML = '';
                            readcomments.appendChild(commentList);
                        }
                    }
                });
            })
            .subscribe();
    }
    // Llamar a la función para suscribirse a las actualizaciones en tiempo real
    subscribeToRealtimeUpdates();


    // Reports
    async function generatePDFTicket(event) {
        event.preventDefault();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const ticketForm = document.getElementById('ticketForm');

        // Obtener los valores del formulario
        const fullName = ticketForm.querySelector('#fullName').value;
        const priority = ticketForm.querySelector('#priority').value;
        const subject = ticketForm.querySelector('#subject').value;
        const description = ticketForm.querySelector('#description').value;

        // Obtener los comentarios
        const commentList = ticketForm.querySelector('#readcomments ul');
        const comments = commentList ? Array.from(commentList.querySelectorAll('li')).map(li => li.textContent) : 'No Comments';

        // Configurar estilos y título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Ticket Data', 14, 22);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Gilberto Fontanez A Software Developer Report', 14, 28);

        // Agregar los datos del formulario al PDF
        doc.setFontSize(12);
        let y = 44; // Posición inicial en Y

        doc.text('Full Name:', 14, y);
        doc.text(fullName, 60, y);
        y += 10;

        doc.text('Priority:', 14, y);
        doc.text(priority, 60, y);
        y += 10;

        doc.text('Subject:', 14, y);
        doc.text(subject, 60, y);
        y += 10;

        doc.text('Description:', 14, y);
        doc.text(description, 60, y);
        y += 10;

        doc.text('Comments:', 14, y);
        doc.text(comments, 60, y);
        y += 10;

        // Abrir el documento PDF en una nueva pestaña o ventana del navegador
        const filename = 'ticket_data.pdf';
        doc.output('dataurlnewwindow', { filename });

    }
    // Agregar evento al botón de descarga de PDF
    const downloadTicketPdfBtn = document.getElementById('downloadTicketPdfBtn');
    downloadTicketPdfBtn.addEventListener('click', generatePDFTicket);


    // Reports Table
    async function generatePDFTable(event) {
        event.preventDefault();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableBody = document.getElementById('tbobyTicketTable');

        // Configurar estilos y título
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Ticket Data', 14, 22);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Gilberto Fontanez A Software Developer Report', 14, 28);

        // Agregar encabezados con estilo
        doc.setFontSize(10);
        let y = 40; // Posición inicial en Y

        doc.setDrawColor(0); // Color del borde (negro)
        doc.setFillColor(200); // Color de fondo (gris claro)
        doc.setLineWidth(0.1); // Ancho del borde

        doc.rect(14, y, 40, 8, 'FD'); // Rectángulo para 'Full Name'
        doc.rect(54, y, 40, 8, 'FD'); // Rectángulo para 'Subject'
        doc.rect(94, y, 30, 8, 'FD'); // Rectángulo para 'Priority'
        doc.rect(124, y, 60, 8, 'FD'); // Rectángulo para 'Description'

        doc.text('Full Name', 16, y + 5); // Texto para 'Full Name'
        doc.text('Subject', 56, y + 5); // Texto para 'Subject'
        doc.text('Priority', 96, y + 5); // Texto para 'Priority'
        doc.text('Description', 126, y + 5); // Texto para 'Description'

        y += 15;

        // Crear tabla en el PDF
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const cols = row.querySelectorAll('td');
            if (cols.length > 0) {
                doc.text(cols[0].textContent, 16, y);
                doc.text(cols[1].textContent, 56, y);
                doc.text(cols[2].textContent, 96, y);
                doc.text(cols[3].textContent, 126, y);
                y += 8;
            }
        });

        // Configurar la acción de impresión automática
        doc.autoPrint();

        // Abrir el documento PDF en una nueva pestaña o ventana del navegador
        const filename = 'ticket_data.pdf';
        try {
            window.open(doc.output('bloburl', { filename: filename }));
        } catch (error) {
            doc.save(filename);
        }
    }
    // Agregar evento al botón de descarga de PDF
    const downloadPdfBtnTable = document.getElementById('downloadPdfBtnTable');
    downloadPdfBtnTable.addEventListener('click', generatePDFTable);


    // Reports
    async function generateExcelTable(event) {
        event.preventDefault();
        // Crear un libro de Excel
        var workbook = XLSX.utils.book_new();
        // Crear una hoja de cálculo
        var sheetData = [['Ticket Data'],
        ['Gilberto Fontanez A Software Developer Report'],
        [' '], ['Full Name', 'Subject', 'Priority', 'Description']];
        var tableBody = document.getElementById('tbobyTicketTable');
        var rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const cols = row.querySelectorAll('td');
            if (cols.length > 0) {
                sheetData.push([
                    cols[0].textContent,
                    cols[1].textContent,
                    cols[2].textContent,
                    cols[3].textContent
                ]);
            }
        });
        var ws = XLSX.utils.aoa_to_sheet(sheetData);
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(workbook, ws, 'Ticket Data');
        // Guardar el archivo de Excel
        XLSX.writeFile(workbook, 'ticket_data.xlsx');
    }

    // Agregar evento al botón de descarga de Excel
    const downloadExcelBtnTable = document.getElementById('downloadExcelBtnTable');
    downloadExcelBtnTable.addEventListener('click', generateExcelTable);

});

