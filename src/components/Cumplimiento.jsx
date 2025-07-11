"use client";

import React, { useEffect, useState } from "react";
import { Table, Select, Card, Typography, InputNumber, Input, message } from "antd";
import NavigationBar from "./NavBar";
import "../components/styles/Cumplimiento.css";

const { Title } = Typography;
const { Option } = Select;

const Cumplimiento = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState("Enero");
  const [actividades, setActividades] = useState([]);

  const mesesDelAnio = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

    // Mapeo para obtener el número del mes
    const numeroMesMap = {
      "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6,
      "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
    };

  // Función para calcular el cumplimiento basado en ejecución
  const calcularCumplimiento = (ejecucion) => {
    // Aseguramos que `ejecucion` sea un número antes de procesar
    const porcentaje = parseFloat(String(ejecucion).replace('%', ''));
    if (isNaN(porcentaje)) return 'Pendiente';
    return porcentaje >= 50 ? 'Aceptable' : 'Pendiente';
  };

  // Obtener datos desde backend
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Obtener el número del mes para la consulta SQL
        const numeroMes = numeroMesMap[mesSeleccionado];
        if (!numeroMes) {
          console.warn("Mes seleccionado no válido:", mesSeleccionado);
          setActividades([]); // Limpiar tabla si el mes no es válido
          return;
        }

        // CAMBIO AQUÍ: Envía el número del mes en lugar del nombre
        const res = await fetch(`http://localhost:3001/api/actividades/cumplimiento?mes=${numeroMes}`);
        const data = await res.json();

        // ... (resto de tu lógica de frontend para manejar data.map)
        if (!Array.isArray(data)) {
          console.error("❌ La respuesta del servidor no es un array:", data);
          message.error("Formato de datos incorrecto desde el servidor.");
          setActividades([]);
          return;
        }
        const datosConCumplimiento = data.map((actividad) => ({
          ...actividad,
          key: actividad.id_actividad,
          pesoPorcentual: parseFloat(actividad.pesoPorcentual) || 0,
          total: parseFloat(actividad.total) || 0,
          ejecucion: parseFloat(String(actividad.ejecucion).replace('%', '')) || 0,
          cumplimiento: calcularCumplimiento(actividad.ejecucion)
        }));
        setActividades(datosConCumplimiento);

      } catch (err) {
        console.error("❌ Error al cargar actividades:", err);
        message.error("No se pudieron cargar las actividades. Revisa la consola del navegador y del servidor.");
      }
    };

    fetchDatos();
  }, [mesSeleccionado]);

  const actualizarCampo = (value, record, campo) => {
    const nuevas = actividades.map(act => {
      if (act.key === record.key) {
        // Normalizar el valor de ejecución a un número para el cálculo
        const nuevaEjecucion = campo === "ejecucion" ? parseFloat(String(value).replace('%', '')) : act.ejecucion;

        return {
          ...act,
          [campo]: value, // Se guarda el valor tal cual fue ingresado en el Input/InputNumber
          cumplimiento: calcularCumplimiento(nuevaEjecucion)
        };
      }
      return act;
    });
    setActividades(nuevas);
  };

  const columnas = [
    { title: "Módulo", dataIndex: "modulo", key: "modulo" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Actividad", dataIndex: "actividad", key: "actividad" },
    {
      title: "Peso Porcentual", dataIndex: "pesoPorcentual", key: "pesoPorcentual", align: "center",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.pesoPorcentual}
          onChange={(value) => actualizarCampo(value, record, "pesoPorcentual")}
          step={0.01} // Permite valores flotantes
        />
      )
    },
    {
      title: "Estado", dataIndex: "estado", key: "estado",
      render: (_, record) => (
        <Input
          value={record.estado}
          onChange={(e) => actualizarCampo(e.target.value, record, "estado")}
        />
      )
    },
    {
      title: "Total", dataIndex: "total", key: "total",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.total}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          onChange={(value) => actualizarCampo(value, record, "total")}
          step={0.01} // Permite valores flotantes
        />
      )
    },
    {
      title: "Ejecución", dataIndex: "ejecucion", key: "ejecucion",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100} // Asumiendo que la ejecución es un porcentaje
          value={parseFloat(String(record.ejecucion).replace('%', ''))} // Asegura que se muestre el valor numérico
          onChange={(value) => actualizarCampo(value !== null ? `${value}%` : null, record, "ejecucion")} // Guardamos con '%' si así lo manejas en el backend/lógica
          step={0.01} // Permite valores flotantes
        />
      )
    },
    {
      title: "Cumplimiento", dataIndex: "cumplimiento", key: "cumplimiento",
      render: (cumplimiento) => {
        let color = cumplimiento === "Aceptable" ? "#68d391" : "#ed8936";
        return <span style={{ color, fontWeight: 500 }}>{cumplimiento}</span>;
      }
    }
  ];

  return (
    <div className="cumplimiento-container">
      <NavigationBar />
      <div className="page-content">
        <Card className="main-card">
          <div className="header-section">
            <Title level={3} className="page-title">Seguimiento de Cumplimiento</Title>
            <div className="filters">
              <Select
                className="month-selector"
                value={mesSeleccionado}
                onChange={(value) => setMesSeleccionado(value)}
                style={{ width: 150 }}
              >
                {mesesDelAnio.map((mes) => (
                  <Option key={mes} value={mes}>{mes}</Option>
                ))}
              </Select>
            </div>
          </div>

          <Table
            className="cumplimiento-table"
            columns={columnas}
            dataSource={actividades}
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Cumplimiento;