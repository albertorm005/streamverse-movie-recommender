document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'd2fb4020c31c94d183d054edf1e50b08';
    let tipoActual = 'movie';
    let modoActual = 'recommended';
    let paginaActual = 1;
    let cargandoMasContenido = false;
    let userId = 'guest'; // Valor por defecto

    // Crear el modal de detalles y añadirlo al body
    const modalDetalles = document.createElement('div');
    modalDetalles.className = 'details-modal';
    modalDetalles.innerHTML = `
        <div class="details-content">
            <div class="details-loading">
                <div class="spinner"></div>
                <p>Cargando detalles...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modalDetalles);

    // Cerrar modal al hacer clic fuera del contenido
    modalDetalles.addEventListener('click', function(e) {
        if (e.target === modalDetalles) {
            cerrarModal();
        }
    });

    // Cerrar modal con la tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });

    // Obtener el ID del usuario actual desde la API
    fetch('/api/usuario/actual')
        .then(response => response.json())
        .then(data => {
            userId = data.idUsuario;
            console.log('ID de usuario cargado:', userId);
            // Inicializar listas después de obtener el ID
            inicializarListasUsuario();
            // Verificar si el usuario ya completó la selección inicial
            const seleccionCompletada = getCookie(`${userId}_seleccionInicialCompletada`);
            if (seleccionCompletada === 'true') {
                // Si la selección ya está completada, cargar la aplicación normalmente
                cargarRecomendaciones(tipoActual);
                configurarEventos();
            } else {
                // Verificar con el servidor si necesita selección inicial
                fetch('/api/usuario/necesitaSeleccionInicial')
                    .then(response => response.json())
                    .then(data => {
                        if (data.necesitaSeleccion) {
                            mostrarSeleccionInicial();
                        } else {
                            // Si el servidor indica que no necesita selección, marcar como completada
                            setCookie(`${userId}_seleccionInicialCompletada`, 'true', 365);
                            cargarRecomendaciones(tipoActual);
                            configurarEventos();
                        }
                    })
                    .catch(error => {
                        console.error('Error al verificar estado de selección inicial:', error);
                        // En caso de error, continuar con la carga normal
                        cargarRecomendaciones(tipoActual);
                        configurarEventos();
                    });
            }
        })
        .catch(error => {
            console.error('Error al obtener información del usuario:', error);
            // Continuar como invitado si hay error
            inicializarListasUsuario();
            cargarRecomendaciones(tipoActual);
            configurarEventos();
        });

    function configurarEventos() {
        // Configurar tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelector('.tab-btn.active').classList.remove('active');
                tab.classList.add('active');
                tipoActual = tab.dataset.type;
                cargarRecomendaciones(tipoActual);
            });
        });

        // Configurar botón de cerrar sesión
        document.querySelector('.logout').addEventListener('click', function(e) {
            e.preventDefault();
            fetch('/logout', {
                method: 'GET'
            })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        console.error('Error al cerrar sesión');
                    }
                })
                .catch(error => {
                    console.error('Error al cerrar sesión:', error);
                });
        });

        // Configurar enlaces de navegación principal
        document.querySelectorAll('.main-nav-link').forEach(link => {
            console.log('Configurando evento para:', link.textContent.trim());
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Clic en:', this.textContent.trim());

                // Obtener tipo y modo desde los atributos data
                const tipo = this.dataset.type || 'none';
                const modo = this.dataset.mode || 'recommended';

                console.log(`Navegación: tipo=${tipo}, modo=${modo}`);

                // Actualizar clase activa en la navegación
                document.querySelectorAll('.main-nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Actualizar variables globales solo si no es modo blog
                if (modo !== 'blog') {
                    tipoActual = tipo;
                }
                modoActual = modo;
                paginaActual = 1;

                // Mostrar u ocultar tabs según el modo
                const tabsContainer = document.querySelector('.tabs');
                const headerContainer = document.querySelector('.recommendations-header');
                headerContainer.querySelector('h1').textContent = this.textContent.trim();

                if (modo === 'blog') {
                    tabsContainer.style.display = 'none';
                    if (document.getElementById('search-container')) {
                        document.getElementById('search-container').style.display = 'none';
                    }
                    mostrarBlog();
                    return;
                } else if (modo === 'lists') {
                    tabsContainer.style.display = 'none';
                    if (document.getElementById('search-container')) {
                        document.getElementById('search-container').style.display = 'none';
                    }
                    mostrarMisListas();
                } else if (modo === 'all') {
                    tabsContainer.style.display = 'none';
                    mostrarBuscador(headerContainer, tipo);
                    cargarTodoContenido(tipo, true);
                } else {
                    tabsContainer.style.display = 'flex';
                    if (document.getElementById('search-container')) {
                        document.getElementById('search-container').style.display = 'none';
                    }

                    // Actualizar el tab activo
                    document.querySelectorAll('.tab-btn').forEach(tab => {
                        if (tab.dataset.type === tipo) {
                            tab.classList.add('active');
                        } else {
                            tab.classList.remove('active');
                        }
                    });

                    cargarRecomendaciones(tipo);
                }
            });
        });

        // Configurar desplazamiento infinito
        window.addEventListener('scroll', function() {
            if (modoActual === 'all' && !cargandoMasContenido) {
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                if (scrollTop + clientHeight >= scrollHeight - 300) {
                    cargarMasContenido();
                }
            }
        });
    }

    // Funciones para gestionar cookies
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

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

    // Inicializar listas del usuario
    function inicializarListasUsuario() {
        if (!getCookie(`${userId}_elementosVistos`)) {
            setCookie(`${userId}_elementosVistos`, JSON.stringify([]), 365);
        }
        if (!getCookie(`${userId}_elementosFavoritos`)) {
            setCookie(`${userId}_elementosFavoritos`, JSON.stringify([]), 365);
        }
        console.log('Listas del usuario inicializadas:', userId);
    }

    // Función para obtener elementos vistos del usuario actual
    function getElementosVistos() {
        const cookieValue = getCookie(`${userId}_elementosVistos`);
        return cookieValue ? JSON.parse(cookieValue) : [];
    }

    // Función para obtener elementos favoritos del usuario actual
    function getElementosFavoritos() {
        const cookieValue = getCookie(`${userId}_elementosFavoritos`);
        return cookieValue ? JSON.parse(cookieValue) : [];
    }

    // Función para guardar elementos vistos en cookie
    function guardarElementoVisto(elemento) {
        const elementosVistos = getElementosVistos();
        const yaExiste = elementosVistos.some(elem =>
            elem.id == elemento.id && elem.tipo === elemento.tipo
        );

        if (!yaExiste) {
            elementosVistos.push(elemento);
            setCookie(`${userId}_elementosVistos`, JSON.stringify(elementosVistos), 365);
            console.log('Elemento añadido a vistos:', elemento);
            return true;
        }
        return false;
    }

    // Función para guardar elementos favoritos en cookie
    function guardarElementoFavorito(elemento) {
        const elementosFavoritos = getElementosFavoritos();
        const yaExiste = elementosFavoritos.some(elem =>
            elem.id == elemento.id && elem.tipo === elemento.tipo
        );

        if (!yaExiste) {
            elementosFavoritos.push(elemento);
            setCookie(`${userId}_elementosFavoritos`, JSON.stringify(elementosFavoritos), 365);
            console.log('Elemento añadido a favoritos:', elemento);
            return true;
        }
        return false;
    }

    // Función para eliminar elemento de favoritos
    function eliminarElementoFavorito(id, tipo) {
        const elementosFavoritos = getElementosFavoritos();
        const nuevaLista = elementosFavoritos.filter(elem =>
            !(elem.id == id && elem.tipo === tipo)
        );

        setCookie(`${userId}_elementosFavoritos`, JSON.stringify(nuevaLista), 365);
        console.log('Elemento eliminado de favoritos:', {id, tipo});
        return true;
    }

    // Función para eliminar elemento de vistos
    function eliminarElementoVisto(id, tipo) {
        const elementosVistos = getElementosVistos();
        const nuevaLista = elementosVistos.filter(elem =>
            !(elem.id == id && elem.tipo === tipo)
        );

        setCookie(`${userId}_elementosVistos`, JSON.stringify(nuevaLista), 365);
        console.log('Elemento eliminado de vistos:', {id, tipo});
        return true;
    }

    function mostrarBuscador(headerContainer, tipo) {
        let searchContainer = document.getElementById('search-container');
        if (!searchContainer) {
            searchContainer = document.createElement('div');
            searchContainer.id = 'search-container';
            searchContainer.className = 'search-container';
            searchContainer.innerHTML = `
                <input type="text" id="search-input" placeholder="Buscar ${tipo === 'movie' ? 'películas' : 'series'}...">
                <button id="search-button">Buscar</button>
            `;
            headerContainer.appendChild(searchContainer);

            // Configurar evento de búsqueda
            document.getElementById('search-button').addEventListener('click', realizarBusqueda);
            document.getElementById('search-input').addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    realizarBusqueda();
                }
            });
        } else {
            searchContainer.style.display = 'flex';
            document.getElementById('search-input').placeholder = `Buscar ${tipo === 'movie' ? 'películas' : 'series'}...`;
            document.getElementById('search-input').value = '';
        }
    }

    function realizarBusqueda() {
        const query = document.getElementById('search-input').value.trim();

        if (!query) {
            cargarTodoContenido(tipoActual, true);
            return;
        }

        const container = document.getElementById('recomendaciones-container');
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Buscando "${query}"...</p>
            </div>
        `;

        fetch(`https://api.themoviedb.org/3/search/${tipoActual}?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=1&include_adult=false`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error en la búsqueda de ${tipoActual === 'movie' ? 'películas' : 'series'}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Resultados de búsqueda (${tipoActual}):`, data);

                if (data.results.length === 0) {
                    container.innerHTML = `
                        <div class="no-results">
                            <p>No se encontraron resultados para "${query}"</p>
                            <button id="clear-search">Volver al catálogo</button>
                        </div>
                    `;
                    document.getElementById('clear-search').addEventListener('click', function() {
                        document.getElementById('search-input').value = '';
                        cargarTodoContenido(tipoActual, true);
                    });
                    return;
                }

                mostrarRecomendaciones(data.results, tipoActual, false);
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = `
                    <div class="error-message">
                        <p>Error al buscar: ${error.message}</p>
                        <button id="clear-search">Volver al catálogo</button>
                    </div>
                `;
                document.getElementById('clear-search').addEventListener('click', function() {
                    document.getElementById('search-input').value = '';
                    cargarTodoContenido(tipoActual, true);
                });
            });
    }

    function cargarRecomendaciones(tipo) {
        const container = document.getElementById('recomendaciones-container');
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Cargando recomendaciones...</p>
            </div>
        `;

        fetch(`/api/recomendaciones/${tipo}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener recomendaciones');
                }
                return response.json();
            })
            .then(data => {
                console.log(`Datos recibidos (${tipo}):`, data);
                let resultados = data;
                if (data.results) resultados = data.results;
                mostrarRecomendaciones(resultados, tipo, false);
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = `
                    <div class="error-message">
                        <p>Error al cargar recomendaciones: ${error.message}</p>
                        <p>Mostrando contenido de ejemplo.</p>
                    </div>
                `;
                if (tipo === 'tv') {
                    cargarDatosEjemplo('tv');
                } else {
                    cargarDatosEjemplo('movie');
                }
            });
    }

    function cargarTodoContenido(tipo, reiniciar = false) {
        if (reiniciar) {
            paginaActual = 1;
            const container = document.getElementById('recomendaciones-container');
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Cargando ${tipo === 'movie' ? 'películas' : 'series'} populares...</p>
                </div>
            `;
        }

        cargandoMasContenido = true;

        fetch(`https://api.themoviedb.org/3/${tipo}/popular?api_key=${apiKey}&language=es-ES&page=${paginaActual}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al obtener ${tipo === 'movie' ? 'películas' : 'series'} populares`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Datos populares recibidos (${tipo}), página ${paginaActual}:`, data);
                mostrarRecomendaciones(data.results, tipo, !reiniciar);
                paginaActual++;
                cargandoMasContenido = false;
            })
            .catch(error => {
                console.error('Error:', error);
                if (reiniciar) {
                    const container = document.getElementById('recomendaciones-container');
                    container.innerHTML = `
                        <div class="error-message">
                            <p>Error al cargar contenido: ${error.message}</p>
                        </div>
                    `;
                }
                cargandoMasContenido = false;
            });
    }

    function cargarMasContenido() {
        if (modoActual === 'all' && !cargandoMasContenido) {
            const container = document.getElementById('recomendaciones-container');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-more';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <p>Cargando más contenido...</p>
            `;
            container.appendChild(loadingIndicator);
            cargarTodoContenido(tipoActual, false);
        }
    }

    function cargarDatosEjemplo(tipo) {
        fetch(`https://api.themoviedb.org/3/${tipo}/popular?api_key=${apiKey}&language=es-ES&page=1`)
            .then(response => response.json())
            .then(data => {
                mostrarRecomendaciones(data.results.slice(0, 10), tipo, false);
            })
            .catch(error => console.error('Error cargando ejemplos:', error));
    }

    // Función para mostrar la selección inicial de películas
    function mostrarSeleccionInicial() {
        const container = document.getElementById('recomendaciones-container');
        container.innerHTML = `
            <div class="initial-selection">
                <h2>¡Bienvenido a nuestra plataforma!</h2>
                <p>Para ofrecerte mejores recomendaciones, selecciona al menos 5 películas que te gusten:</p>
                <div class="selection-grid" id="selection-grid">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Cargando películas populares...</p>
                    </div>
                </div>
                <div class="selection-actions">
                    <button id="finish-selection" class="btn-primary" disabled>Finalizar selección (0/5)</button>
                </div>
            </div>
        `;

        cargarPeliculasSeleccionInicial();
    }

    // Función para cargar películas populares para la selección inicial
    function cargarPeliculasSeleccionInicial() {
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=es-ES&page=1`)
            .then(response => response.json())
            .then(data => {
                mostrarPeliculasSeleccion(data.results.slice(0, 20));
            })
            .catch(error => {
                console.error('Error al cargar películas para selección:', error);
                document.getElementById('selection-grid').innerHTML = `
                    <div class="error-message">
                        <p>Error al cargar películas. <a href="javascript:cargarPeliculasSeleccionInicial()">Reintentar</a></p>
                    </div>
                `;
            });
    }

    // Función para mostrar las películas de selección inicial
    function mostrarPeliculasSeleccion(peliculas) {
        const grid = document.getElementById('selection-grid');
        grid.innerHTML = '';

        const seleccionadas = new Set();

        peliculas.forEach(pelicula => {
            const posterUrl = pelicula.poster_path
                ? `https://image.tmdb.org/t/p/w300${pelicula.poster_path}`
                : 'https://via.placeholder.com/300x450?text=Sin+Imagen';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'selection-card';
            tarjeta.dataset.id = pelicula.id;

            tarjeta.innerHTML = `
                <img src="${posterUrl}" alt="${pelicula.title}">
                <div class="selection-info">
                    <h3>${pelicula.title}</h3>
                    <p>${pelicula.release_date ? pelicula.release_date.substring(0, 4) : 'N/A'}</p>
                </div>
                <div class="selection-overlay">
                    <span class="selection-check">✓</span>
                </div>
            `;

            tarjeta.addEventListener('click', function() {
                this.classList.toggle('selected');

                if (this.classList.contains('selected')) {
                    seleccionadas.add(pelicula.id);
                } else {
                    seleccionadas.delete(pelicula.id);
                }

                const btnFinalizar = document.getElementById('finish-selection');
                btnFinalizar.textContent = `Finalizar selección (${seleccionadas.size}/5)`;
                btnFinalizar.disabled = seleccionadas.size < 5;
            });

            grid.appendChild(tarjeta);
        });

        document.getElementById('finish-selection').addEventListener('click', function() {
            const peliculasSeleccionadas = Array.from(document.querySelectorAll('.selection-card.selected')).map(card => card.dataset.id);
            guardarSeleccionInicial(peliculasSeleccionadas);
        });
    }

    // Función para guardar la selección inicial
    function guardarSeleccionInicial(peliculasIds) {
        document.getElementById('finish-selection').disabled = true;
        document.getElementById('finish-selection').textContent = 'Guardando selección...';

        fetch('/api/usuario/guardarSeleccionInicial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ peliculasIds: peliculasIds })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al guardar selección');
                }
                return response.json();
            })
            .then(data => {
                // Marcar la selección como completada
                setCookie(`${userId}_seleccionInicialCompletada`, 'true', 365);
                cargarRecomendaciones(tipoActual);
                configurarEventos();
            })
            .catch(error => {
                console.error('Error al guardar selección inicial:', error);
                alert('Ocurrió un error al guardar tu selección. Por favor, intenta nuevamente.');
                document.getElementById('finish-selection').disabled = false;
                document.getElementById('finish-selection').textContent = 'Reintentar';
            });
    }

    function mostrarMisListas() {
        const container = document.getElementById('recomendaciones-container');
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando tus listas...</p></div>';

        try {
            const elementosVistos = getElementosVistos();
            const elementosFavoritos = getElementosFavoritos();

            console.log('Elementos vistos:', elementosVistos.length);
            console.log('Elementos favoritos:', elementosFavoritos.length);

            let html = '';
            html += '<div class="list-section">';
            html += `<h2>Películas y series favoritas (${elementosFavoritos.length})</h2>`;
            html += '<div class="list-items">';

            if (elementosFavoritos.length > 0) {
                elementosFavoritos.forEach(item => {
                    html += crearTarjetaLista(item, 'favorito');
                });
            } else {
                html += '<div class="empty-list">Aún no has añadido ningún elemento a favoritos</div>';
            }

            html += '</div></div>';
            html += '<div class="list-section">';
            html += `<h2>Películas y series vistas (${elementosVistos.length})</h2>`;
            html += '<div class="list-items">';

            if (elementosVistos.length > 0) {
                elementosVistos.forEach(item => {
                    html += crearTarjetaLista(item, 'visto');
                });
            } else {
                html += '<div class="empty-list">Aún no has marcado ningún elemento como visto</div>';
            }

            html += '</div></div>';

            container.innerHTML = html;

            document.querySelectorAll('.ver-detalles').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const tipo = this.dataset.tipo;
                    mostrarDetalles(id, tipo);
                };
            });

            document.querySelectorAll('.quitar-lista').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const tipo = this.dataset.tipo;
                    const listaTipo = this.dataset.lista;

                    if (listaTipo === 'favorito') {
                        eliminarElementoFavorito(id, tipo);
                    } else if (listaTipo === 'visto') {
                        eliminarElementoVisto(id, tipo);
                    }

                    mostrarMisListas();
                };
            });

        } catch (error) {
            console.error('Error al mostrar las listas:', error);
            container.innerHTML = '<p class="error">Error al cargar tus listas. Por favor, intenta nuevamente.</p>';
        }
    }

    function crearTarjetaLista(item, tipoLista) {
        return `
        <div class="list-item">
            <img src="${item.imagen}" alt="${item.titulo}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sin+Imagen';">
            <div class="list-item-info">
                <h3 class="list-item-title">${item.titulo}</h3>
                <p class="list-item-year">${item.fecha ? new Date(item.fecha).getFullYear() : 'N/A'}</p>
                <div class="list-item-buttons">
                    <button class="ver-detalles" data-id="${item.id}" data-tipo="${item.tipo}">Ver detalles</button>
                    <button class="quitar-lista" data-id="${item.id}" data-tipo="${item.tipo}" data-lista="${tipoLista}">Quitar</button>
                </div>
            </div>
        </div>
        `;
    }

    function mostrarRecomendaciones(recomendaciones, tipo, append = false) {
        const container = document.getElementById('recomendaciones-container');
        const loadingMore = container.querySelector('.loading-more');
        if (loadingMore) {
            loadingMore.remove();
        }

        if (!recomendaciones || recomendaciones.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="no-recommendations">
                        <p>No hay recomendaciones disponibles en este momento.</p>
                    </div>
                `;
            }
            return;
        }

        if (!append) {
            container.innerHTML = '';
            const tarjetasContainer = document.createElement('div');
            tarjetasContainer.className = 'recommendations-grid';
            tarjetasContainer.id = 'tarjetas-container';
            container.appendChild(tarjetasContainer);
        }

        const tarjetasContainer = document.getElementById('tarjetas-container');
        const elementosVistos = getElementosVistos();
        const elementosFavoritos = getElementosFavoritos();

        recomendaciones.forEach(item => {
            const titulo = tipo === 'tv' ? (item.name || 'Sin título') : (item.title || 'Sin título');
            const fecha = tipo === 'tv' ? item.firstAirDate || item.first_air_date : item.releaseDate || item.release_date;
            const año = fecha ? fecha.substring(0, 4) : 'N/A';

            const elemento = document.createElement('div');
            elemento.className = 'recommendation-card';
            const estaVisto = elementosVistos.some(elem =>
                elem.id == (item.id || item.tmdbId) && elem.tipo === tipo
            );

            if (estaVisto) {
                elemento.classList.add('visto');
            }

            let posterUrl;
            if (item.posterPath) {
                posterUrl = item.posterPath;
            } else if (item.poster_path) {
                posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            } else {
                posterUrl = 'https://via.placeholder.com/300x450?text=Sin+Imagen';
            }

            const rating = item.voteAverage || item.vote_average || 0;

            elemento.innerHTML = `
                <img loading="lazy" src="${posterUrl}" alt="${titulo}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sin+Imagen';">
                <div class="recommendation-info">
                    <h3>${titulo}</h3>
                    <div class="recommendation-meta">
                        <span class="year">${año}</span>
                        <span class="rating">★ ${(rating / 2).toFixed(1)}</span>
                    </div>
                    <div class="recommendation-actions">
                        <button class="ver-detalles" data-id="${item.id || item.tmdbId}" data-tipo="${tipo}">Ver detalles</button>
                        <button class="marcar-visto" ${estaVisto ? 'disabled' : ''}>${estaVisto ? 'Visto ✓' : 'Marcar visto'}</button>
                    </div>
                </div>
            `;
            tarjetasContainer.appendChild(elemento);
        });

        document.querySelectorAll('.ver-detalles').forEach(btn => {
            console.log('Configurando botón de detalles para:', btn.dataset.id);
            btn.onclick = function() {
                const id = this.dataset.id;
                const tipo = this.dataset.tipo;
                console.log('Mostrando detalles para:', id, tipo);
                mostrarDetalles(id, tipo);
            };
        });

        document.querySelectorAll('.marcar-visto').forEach(btn => {
            if (!btn.disabled) {
                btn.onclick = function() {
                    this.textContent = "Visto ✓";
                    this.disabled = true;
                    this.classList.add('visto');

                    const card = this.closest('.recommendation-card');
                    if (card) {
                        card.classList.add('visto');
                        const detallesBtn = card.querySelector('.ver-detalles');
                        const id = detallesBtn.dataset.id;
                        const tipo = detallesBtn.dataset.tipo;
                        const imagen = card.querySelector('img').src;
                        const titulo = card.querySelector('h3').textContent;

                        guardarElementoVisto({
                            id: id,
                            tipo: tipo,
                            titulo: titulo,
                            imagen: imagen,
                            fecha: new Date().toISOString()
                        });
                    }
                };
            }
        });
    }

    function mostrarBlog() {
        const container = document.getElementById('recomendaciones-container');
        if (!localStorage.getItem('blogOpinionesCompartidas')) {
            localStorage.setItem('blogOpinionesCompartidas', JSON.stringify([]));
        }

        container.innerHTML = `
        <div class="blog-container">
            <div class="blog-header">
                <h2>Blog de Opiniones</h2>
                <button id="nueva-opinion-btn" class="btn-primary">Compartir mi opinión</button>
            </div>
            <div class="blog-filter">
                <select id="filtro-opiniones">
                    <option value="recientes">Más recientes</option>
                    <option value="populares">Más populares</option>
                </select>
            </div>
            <div id="opiniones-list" class="opiniones-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Cargando opiniones...</p>
                </div>
            </div>
        </div>
    `;

        document.getElementById('nueva-opinion-btn').addEventListener('click', mostrarFormularioOpinion);
        document.getElementById('filtro-opiniones').addEventListener('change', filtrarOpiniones);
        cargarOpiniones('recientes');
    }

    function mostrarFormularioOpinion() {
        console.log('Mostrando formulario de opinión');
        const modal = document.createElement('div');
        modal.className = 'opinion-modal';
        modal.innerHTML = `
        <div class="opinion-form-container">
            <button class="close-btn">×</button>
            <h3>Compartir tu opinión</h3>
            <form id="opinion-form">
                <div class="form-group">
                    <label for="opinion-titulo">Título de la opinión:</label>
                    <input type="text" id="opinion-titulo" required placeholder="Ej: Mi opinión sobre Interstellar">
                </div>
                <div class="form-group">
                    <label for="opinion-pelicula">Película/Serie:</label>
                    <input type="text" id="opinion-pelicula" required placeholder="Nombre de la película o serie">
                </div>
                <div class="form-group">
                    <label for="opinion-texto">Tu opinión:</label>
                    <textarea id="opinion-texto" rows="6" required placeholder="Comparte tu opinión..."></textarea>
                </div>
                <div class="form-group">
                    <label for="opinion-valoracion">Tu valoración:</label>
                    <select id="opinion-valoracion">
                        <option value="5">⭐⭐⭐⭐⭐ - Excelente</option>
                        <option value="4">⭐⭐⭐⭐ - Muy buena</option>
                        <option value="3">⭐⭐⭐ - Buena</option>
                        <option value="2">⭐⭐ - Regular</option>
                        <option value="1">⭐ - Mala</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Publicar opinión</button>
            </form>
        </div>
    `;

        document.body.appendChild(modal);
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('opinion-form').addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulario enviado - llamando a guardarOpinion()');
            guardarOpinion();
            document.body.removeChild(modal);
        });
    }

    function guardarOpinion() {
        console.log('Ejecutando guardarOpinion()');
        try {
            const tituloInput = document.getElementById('opinion-titulo');
            const peliculaInput = document.getElementById('opinion-pelicula');
            const textoInput = document.getElementById('opinion-texto');
            const valoracionSelect = document.getElementById('opinion-valoracion');

            if (!tituloInput || !peliculaInput || !textoInput || !valoracionSelect) {
                console.error('No se encontraron los elementos del formulario:', {tituloInput, peliculaInput, textoInput, valoracionSelect});
                alert('Error al procesar el formulario. Por favor, intenta de nuevo.');
                return;
            }

            const titulo = tituloInput.value.trim();
            const pelicula = peliculaInput.value.trim();
            const texto = textoInput.value.trim();
            const valoracion = valoracionSelect.value;

            console.log('Valores del formulario:', {titulo, pelicula, texto, valoracion});

            if (!titulo || !pelicula || !texto) {
                alert('Por favor, completa todos los campos');
                return;
            }

            const usuarioElement = document.querySelector('.profile');
            const usuario = usuarioElement ? usuarioElement.textContent.trim() : 'Usuario Anónimo';

            const nuevaOpinion = {
                id: Date.now().toString(),
                titulo: titulo,
                pelicula: pelicula,
                texto: texto,
                valoracion: parseInt(valoracion),
                usuario: usuario,
                fecha: new Date().toISOString(),
                likes: 0,
                dislikes: 0,
                votosUsuarios: {}
            };

            let opiniones = [];
            const opinionesGuardadas = localStorage.getItem('blogOpinionesCompartidas');

            if (opinionesGuardadas) {
                try {
                    opiniones = JSON.parse(opinionesGuardadas);
                    if (!Array.isArray(opiniones)) {
                        console.warn('blogOpinionesCompartidas no es un array, reiniciando:', opiniones);
                        opiniones = [];
                    }
                } catch (e) {
                    console.warn('Error al parsear blogOpinionesCompartidas, reiniciando:', e);
                    opiniones = [];
                }
            }

            opiniones.unshift(nuevaOpinion);
            localStorage.setItem('blogOpinionesCompartidas', JSON.stringify(opiniones));
            console.log('Opinión guardada con éxito. Opiniones totales:', opiniones.length);

            alert('¡Tu opinión ha sido publicada con éxito!');
            setTimeout(() => {
                const filtroSelect = document.getElementById('filtro-opiniones');
                const filtro = filtroSelect ? filtroSelect.value : 'recientes';
                cargarOpiniones(filtro);
            }, 100);

        } catch (error) {
            console.error('Error al guardar opinión:', error);
            alert('Error al guardar tu opinión: ' + error.message);
        }
    }

    function eliminarOpinion(opinionId) {
        const usuarioActual = document.querySelector('.profile')?.textContent.trim() || 'Usuario';
        let opiniones = [];
        try {
            const opinionesGuardadas = localStorage.getItem('blogOpinionesCompartidas');
            if (opinionesGuardadas) {
                opiniones = JSON.parse(opinionesGuardadas);
            }
        } catch (error) {
            console.error('Error al obtener opiniones:', error);
            return false;
        }

        if (!Array.isArray(opiniones)) {
            console.error('Las opiniones no son un array válido');
            return false;
        }

        const opinionIndex = opiniones.findIndex(op => op.id === opinionId);
        if (opinionIndex === -1) {
            console.error('No se encontró la opinión con ID:', opinionId);
            return false;
        }

        if (opiniones[opinionIndex].usuario !== usuarioActual) {
            console.error('No tienes permiso para eliminar esta opinión');
            alert('Solo puedes eliminar tus propias opiniones');
            return false;
        }

        opiniones.splice(opinionIndex, 1);
        localStorage.setItem('blogOpinionesCompartidas', JSON.stringify(opiniones));
        const filtro = document.getElementById('filtro-opiniones')?.value || 'recientes';
        cargarOpiniones(filtro);
        return true;
    }

    function cargarOpiniones(filtro) {
        console.log('Cargando opiniones con filtro:', filtro);
        const opinionesContainer = document.getElementById('opiniones-list');

        if (!opinionesContainer) {
            console.error('No se encontró el contenedor de opiniones');
            return;
        }

        opinionesContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando opiniones...</p>
        </div>
    `;

        let opiniones = [];
        try {
            const opinionesGuardadas = localStorage.getItem('blogOpinionesCompartidas');
            console.log('Datos en localStorage:', opinionesGuardadas);
            if (opinionesGuardadas) {
                opiniones = JSON.parse(opinionesGuardadas);
            }
        } catch (error) {
            console.error('Error al recuperar opiniones:', error);
        }

        if (!Array.isArray(opiniones)) {
            opiniones = [];
        }

        console.log('Opiniones recuperadas:', opiniones.length);

        if (opiniones.length === 0) {
            opinionesContainer.innerHTML = `
            <div class="no-opiniones">
                <p>No hay opiniones todavía. ¡Sé el primero en compartir tu opinión!</p>
            </div>
        `;
            return;
        }

        if (filtro === 'populares') {
            opiniones.sort((a, b) => (b.likes || 0) - (b.dislikes || 0) - ((a.likes || 0) - (a.dislikes || 0)));
        } else {
            opiniones.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        }

        let html = '';
        opiniones.forEach(opinion => {
            html += crearTarjetaOpinion(opinion);
        });

        opinionesContainer.innerHTML = html;

        document.querySelectorAll('.like-btn, .dislike-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const opinionId = this.closest('.opinion-card').dataset.id;
                const esLike = this.classList.contains('like-btn');
                votarOpinion(opinionId, esLike);
            });
        });

        document.querySelectorAll('.eliminar-opinion-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const opinionId = this.closest('.opinion-card').dataset.id;
                if (confirm('¿Estás seguro de que deseas eliminar esta opinión? Esta acción no se puede deshacer.')) {
                    eliminarOpinion(opinionId);
                }
            });
        });
    }

    function crearTarjetaOpinion(opinion) {
        const usuarioActual = document.querySelector('.profile')?.textContent.trim() || 'Usuario';
        const votoUsuario = opinion.votosUsuarios?.[usuarioActual] || null;
        const likeActivo = votoUsuario === 'like' ? 'active' : '';
        const dislikeActivo = votoUsuario === 'dislike' ? 'active' : '';
        const esPropietario = opinion.usuario === usuarioActual;
        let estrellas = '';
        for (let i = 0; i < 5; i++) {
            if (i < opinion.valoracion) {
                estrellas += '⭐';
            }
        }
        const fecha = new Date(opinion.fecha);
        const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

        return `
    <div class="opinion-card" data-id="${opinion.id}">
        <div class="opinion-header">
            <div>
                <h3 class="opinion-titulo">${opinion.titulo}</h3>
                <div class="opinion-meta">
                    <span class="opinion-autor">Por: ${opinion.usuario}</span>
                    <span class="opinion-fecha">${fechaFormateada}</span>
                </div>
            </div>
            ${esPropietario ? '<button class="eliminar-opinion-btn" title="Eliminar opinión">🗑️</button>' : ''}
        </div>
        <div class="opinion-content">
            <div class="opinion-pelicula-info">
                <span class="opinion-pelicula">${opinion.pelicula}</span>
                <span class="opinion-valoracion">${estrellas}</span>
            </div>
            <p class="opinion-texto">${opinion.texto}</p>
        </div>
        <div class="opinion-footer">
            <div class="opinion-votos">
                <button class="like-btn ${likeActivo}">
                    <span class="icon">👍</span>
                    <span class="count">${opinion.likes || 0}</span>
                </button>
                <button class="dislike-btn ${dislikeActivo}">
                    <span class="icon">👎</span>
                    <span class="count">${opinion.dislikes || 0}</span>
                </button>
            </div>
        </div>
    </div>
    `;
    }

    function votarOpinion(opinionId, esLike) {
        const usuarioActual = document.querySelector('.profile')?.textContent.trim() || 'Usuario Anónimo';
        console.log('Usuario votando:', usuarioActual);

        let opiniones = [];
        try {
            const opinionesGuardadas = localStorage.getItem('blogOpinionesCompartidas');
            if (opinionesGuardadas) {
                opiniones = JSON.parse(opinionesGuardadas);
            }
        } catch (error) {
            console.error('Error al obtener opiniones:', error);
            return;
        }

        if (!Array.isArray(opiniones)) {
            console.error('Las opiniones recuperadas no son un array válido');
            return;
        }

        const opinionIndex = opiniones.findIndex(op => op.id === opinionId);
        if (opinionIndex === -1) {
            console.error('No se encontró la opinión con ID:', opinionId);
            return;
        }

        const opinion = opiniones[opinionIndex];
        console.log('Opinión encontrada:', opinion);

        if (!opinion.votosUsuarios) {
            opinion.votosUsuarios = {};
        }

        const votoAnterior = opinion.votosUsuarios[usuarioActual] || null;
        console.log('Voto anterior del usuario actual:', votoAnterior);

        if (votoAnterior === null) {
            if (esLike) {
                opinion.likes = (opinion.likes || 0) + 1;
                opinion.votosUsuarios[usuarioActual] = 'like';
            } else {
                opinion.dislikes = (opinion.dislikes || 0) + 1;
                opinion.votosUsuarios[usuarioActual] = 'dislike';
            }
        } else if (votoAnterior === 'like') {
            if (esLike) {
                opinion.likes = Math.max(0, (opinion.likes || 0) - 1);
                delete opinion.votosUsuarios[usuarioActual];
            } else {
                opinion.likes = Math.max(0, (opinion.likes || 0) - 1);
                opinion.dislikes = (opinion.dislikes || 0) + 1;
                opinion.votosUsuarios[usuarioActual] = 'dislike';
            }
        } else if (votoAnterior === 'dislike') {
            if (esLike) {
                opinion.dislikes = Math.max(0, (opinion.dislikes || 0) - 1);
                opinion.likes = (opinion.likes || 0) + 1;
                opinion.votosUsuarios[usuarioActual] = 'like';
            } else {
                opinion.dislikes = Math.max(0, (opinion.dislikes || 0) - 1);
                delete opinion.votosUsuarios[usuarioActual];
            }
        }

        opiniones[opinionIndex] = opinion;
        console.log('Guardando opiniones actualizadas:', opiniones);
        localStorage.setItem('blogOpinionesCompartidas', JSON.stringify(opiniones));
        const filtro = document.getElementById('filtro-opiniones')?.value || 'recientes';
        cargarOpiniones(filtro);
    }

    function mostrarDetalles(id, tipo) {
        console.log('Mostrando detalles para ID:', id, 'Tipo:', tipo);
        modalDetalles.classList.add('active');
        document.body.style.overflow = 'hidden';

        const modalContent = modalDetalles.querySelector('.details-content');
        modalContent.innerHTML = `
            <div class="details-loading">
                <div class="spinner"></div>
                <p>Cargando detalles... (ID: ${id}, Tipo: ${tipo})</p>
            </div>
        `;

        const apiUrl = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${apiKey}&language=es-ES&append_to_response=credits`;
        console.log('Consultando API:', apiUrl);

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar los detalles: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Detalles obtenidos:', data);
                renderizarDetalles(data, tipo);
            })
            .catch(error => {
                console.error('Error en mostrarDetalles:', error);
                modalContent.innerHTML = `
                    <div class="details-error">
                        <h3>Error al cargar los detalles</h3>
                        <p>${error.message}</p>
                        <button class="details-close">Cerrar</button>
                    </div>
                `;
                modalContent.querySelector('.details-close').addEventListener('click', cerrarModal);
            });
    }

    function renderizarDetalles(item, tipo) {
        const esMovie = tipo === 'movie';
        const titulo = esMovie ? item.title : item.name;
        const fecha = esMovie ? item.release_date : item.first_air_date;
        const año = fecha ? fecha.substring(0, 4) : 'N/A';
        const backdropUrl = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
            : 'https://via.placeholder.com/1280x720?text=Sin+Imagen';
        const posterUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://via.placeholder.com/300x450?text=Sin+Imagen';
        let duracion = '';
        if (esMovie) {
            duracion = item.runtime ? `${item.runtime} min` : 'Duración desconocida';
        } else {
            duracion = `${item.number_of_seasons} temporada${item.number_of_seasons !== 1 ? 's' : ''}`;
        }
        const generos = item.genres.map(g => g.name).join(', ');
        const rating = item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A';
        let repartoHTML = '';
        if (item.credits && item.credits.cast) {
            const reparto = item.credits.cast.slice(0, 6);
            repartoHTML = reparto.map(actor => {
                const fotoUrl = actor.profile_path
                    ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                    : 'https://via.placeholder.com/200x300?text=Sin+Foto';
                return `
                    <div class="cast-item">
                        <img src="${fotoUrl}" alt="${actor.name}" class="cast-photo"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300?text=Sin+Foto';">
                        <p class="cast-name">${actor.name}</p>
                        <p class="cast-character">${actor.character || ''}</p>
                    </div>
                `;
            }).join('');
        }

        const itemId = item.id;
        const elementosVistos = getElementosVistos();
        const elementosFavoritos = getElementosFavoritos();
        const estaVisto = elementosVistos.some(elem => elem.id == itemId && elem.tipo === tipo);
        const estaFavorito = elementosFavoritos.some(elem => elem.id == itemId && elem.tipo === tipo);

        const modalContent = modalDetalles.querySelector('.details-content');
        modalContent.innerHTML = `
            <div class="details-header">
                <img src="${backdropUrl}" alt="${titulo}" class="details-backdrop"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/1280x720?text=Sin+Imagen';">
                <img src="${posterUrl}" alt="${titulo}" class="details-poster"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sin+Imagen';">
                <button class="details-close">×</button>
            </div>
            <div class="details-body">
                <div class="details-title-section">
                    <h2 class="details-title">${titulo} <span class="details-year">(${año})</span></h2>
                    <div class="details-rating">
                        <span>★</span>
                        <span>${rating}</span>
                    </div>
                </div>
                <div class="details-info">
                    ${duracion ? `<span>${duracion}</span>` : ''}
                    ${generos ? `<span>${generos}</span>` : ''}
                </div>
                <div class="details-overview">
                    ${item.overview || 'No hay sinopsis disponible.'}
                </div>
                ${repartoHTML ? `
                    <div class="details-cast">
                        <h3>Reparto principal</h3>
                        <div class="cast-list">${repartoHTML}</div>
                    </div>` : ''}
                <div class="details-actions">
                    <button class="details-action-btn details-watch ${estaVisto ? 'visto' : ''}">${estaVisto ? '✓ Ya visto' : 'Marcar como visto'}</button>
                    <button class="details-action-btn details-favorite ${estaFavorito ? 'favorito' : ''}">${estaFavorito ? '❤ En favoritos' : '❤ Añadir a favoritos'}</button>
                </div>
            </div>
        `;

        modalContent.querySelector('.details-close').addEventListener('click', cerrarModal);

        const verBtn = modalContent.querySelector('.details-watch');
        if (verBtn) {
            if (estaVisto) {
                verBtn.disabled = true;
            } else {
                verBtn.onclick = function() {
                    this.disabled = true;
                    this.textContent = '✓ Ya visto';
                    this.classList.add('visto');
                    guardarElementoVisto({
                        id: itemId,
                        tipo: tipo,
                        titulo: titulo,
                        imagen: posterUrl,
                        fecha: new Date().toISOString()
                    });
                };
            }
        }

        const favBtn = modalContent.querySelector('.details-favorite');
        if (favBtn) {
            favBtn.onclick = function() {
                if (this.classList.contains('favorito')) {
                    if (eliminarElementoFavorito(itemId, tipo)) {
                        this.classList.remove('favorito');
                        this.textContent = '❤ Añadir a favoritos';
                    }
                } else {
                    if (guardarElementoFavorito({
                        id: itemId,
                        tipo: tipo,
                        titulo: titulo,
                        imagen: posterUrl,
                        fecha: new Date().toISOString()
                    })) {
                        this.classList.add('favorito');
                        this.textContent = '❤ En favoritos';
                    }
                }
            };
        }
    }

    function cerrarModal() {
        modalDetalles.classList.remove('active');
        document.body.style.overflow = '';
    }

    function filtrarOpiniones() {
        const filtro = document.getElementById('filtro-opiniones').value;
        cargarOpiniones(filtro);
    }

    window.cerrarModal = cerrarModal;
    window.mostrarDetalles = mostrarDetalles;
});