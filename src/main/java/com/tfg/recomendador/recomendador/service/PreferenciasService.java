package com.tfg.recomendador.recomendador.service;

import com.tfg.recomendador.recomendador.dto.PreferenciasDTO;
import com.tfg.recomendador.recomendador.model.PreferenciaUsuario;
import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.repository.PreferenciaUsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class PreferenciasService {

    private final PreferenciaUsuarioRepository preferenciaRepository;
    private final UsuarioService usuarioService;
    private final RestTemplate restTemplate;

    @Value("${tmdb.api.key}")
    private String apiKey;

    public PreferenciasService(PreferenciaUsuarioRepository preferenciaRepository,
                               UsuarioService usuarioService,
                               RestTemplate restTemplate) {
        this.preferenciaRepository = preferenciaRepository;
        this.usuarioService = usuarioService;
        this.restTemplate = restTemplate;
    }

    public void guardarPreferencias(PreferenciasDTO preferenciasDTO) {
        Usuario usuario = obtenerUsuarioActual();

        // Eliminar preferencias anteriores si existen
        List<PreferenciaUsuario> preferenciasExistentes = preferenciaRepository.findByUsuario(usuario);
        preferenciaRepository.deleteAll(preferenciasExistentes);

        // Guardar nuevas preferencias
        for (Integer idPelicula : preferenciasDTO.getPeliculasIds()) {
            PreferenciaUsuario preferencia = new PreferenciaUsuario();
            preferencia.setUsuario(usuario);
            preferencia.setIdPelicula(idPelicula);
            preferencia.setTipo("pelicula"); // Por defecto, ajustar si es necesario

            preferenciaRepository.save(preferencia);
        }
    }

    public boolean tienePreferencias() {
        Usuario usuario = obtenerUsuarioActual();
        return preferenciaRepository.existsByUsuario(usuario);
    }

    private Usuario obtenerUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return usuarioService.obtenerPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}