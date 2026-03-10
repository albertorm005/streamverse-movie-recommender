package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.dto.RegistroDTO;
import com.tfg.recomendador.recomendador.model.Usuario;
import com.tfg.recomendador.recomendador.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public String registro(RegistroDTO registroDTO, RedirectAttributes redirectAttributes) {
        try {
            Usuario usuario = new Usuario();
            usuario.setNombre(registroDTO.getNombre());
            usuario.setEmail(registroDTO.getEmail());
            usuario.setPassword(passwordEncoder.encode(registroDTO.getPassword()));

            usuarioRepository.save(usuario);

            // Agregar mensaje de éxito para mostrar en la página de login
            redirectAttributes.addFlashAttribute("mensajeExito", "Usuario registrado correctamente. Por favor, inicia sesión.");

            // Redireccionar a la página de login
            return "redirect:/login.html";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al registrar usuario: " + e.getMessage());
            return "redirect:/register.html";
        }
    }
}