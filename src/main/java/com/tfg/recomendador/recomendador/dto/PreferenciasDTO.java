package com.tfg.recomendador.recomendador.dto;

import java.util.List;

public class PreferenciasDTO {
    private List<Integer> peliculasIds;

    public List<Integer> getPeliculasIds() {
        return peliculasIds;
    }

    public void setPeliculasIds(List<Integer> peliculasIds) {
        this.peliculasIds = peliculasIds;
    }
}