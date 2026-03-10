package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SeleccionController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/api/check-seleccion-inicial")
    public Map<String, Boolean> checkSeleccionInicial() {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        return Map.of("completada", usuarioActual.isSeleccionInicialCompleta());
    }

    @PostMapping("/api/completar-seleccion-inicial")
    public void completarSeleccionInicial() {
        Usuario usuarioActual = usuarioService.getUsuarioActual();
        usuarioActual.setSeleccionInicialCompleta(true);
        usuarioService.guardarUsuario(usuarioActual);
    }
}