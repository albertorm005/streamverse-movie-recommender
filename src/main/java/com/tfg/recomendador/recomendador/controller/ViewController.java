package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.service.PreferenciasService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    private final PreferenciasService preferenciasService;

    public ViewController(PreferenciasService preferenciasService) {
        this.preferenciasService = preferenciasService;
    }

    @GetMapping("/login")
    public String loginPage() {
        return "redirect:/login.html";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "redirect:/register.html";
    }

    @GetMapping("/inicio")
    public String paginaInicio() {
        // Redirigir a selección de preferencias si el usuario no tiene preferencias guardadas
        if (!preferenciasService.tienePreferencias()) {
            return "redirect:/seleccion-preferencias.html";
        }

        // Si ya tiene preferencias, mostrar la página de recomendaciones
        return "redirect:/recomendaciones.html";
    }

    @GetMapping("/recomendaciones")
    public String paginaRecomendaciones() {
        return "redirect:/recomendaciones.html";
    }
}