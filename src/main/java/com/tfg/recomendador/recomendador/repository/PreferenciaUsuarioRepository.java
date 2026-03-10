package com.tfg.recomendador.recomendador.repository;

import com.tfg.recomendador.recomendador.model.PreferenciaUsuario;
import com.tfg.recomendador.recomendador.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreferenciaUsuarioRepository extends JpaRepository<PreferenciaUsuario, Integer> {
    List<PreferenciaUsuario> findByUsuario(Usuario usuario);
    boolean existsByUsuario(Usuario usuario);
}