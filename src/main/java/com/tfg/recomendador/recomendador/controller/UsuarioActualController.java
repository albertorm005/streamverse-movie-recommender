package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/usuario/actual")
public class UsuarioActualController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public Map<String, Object> obtenerUsuarioActual(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication != null && authentication.isAuthenticated()) {
            try {
                Usuario usuario = usuarioService.getUsuarioActual();
                response.put("idUsuario", usuario.getIdUsuario());
                response.put("nombre", usuario.getNombre());
                response.put("email", usuario.getEmail());
            } catch (Exception e) {
                // Si hay algún error al obtener el usuario, usar guest
                response.put("idUsuario", "guest");
            }
        } else {
            response.put("idUsuario", "guest");
        }

        return response;
    }
}