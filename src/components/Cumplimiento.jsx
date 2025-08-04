"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  Card,
  Typography,
  InputNumber,
  Input,
  message,
  Modal
} from "antd";
import NavigationBar from "./NavBar";
import "../components/styles/Cumplimiento.css";

const { Title } = Typography;
const { Option } = Select;

const Cumplimiento = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState("Enero");
  const [actividades, setActividades] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleActividades, setDetalleActividades] = useState([]);

  const mesesDelAnio = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const numeroMesMap = {
    "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6,
    "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
  };

  /* Carga la lista de proyectos una sola vez */
  useEffect(() => {
    fetch("http://localhost:3001/api/proyectos")
      .then((r) => r.json())
      .then(setProyectos)
      .catch(() => message.error("No se pudieron cargar los proyectos."));
  }, []);

  /* Calcula el cumplimiento */
  const calcularCumplimiento = (ejecucion) => {
    const porcentaje = parseFloat(String(ejecucion).replace("%", ""));
    return isNaN(porcentaje) ? "Pendiente" : porcentaje >= 50 ? "Aceptable" : "Pendiente";
  };

  /* Carga la tabla principal (sin filtrar por proyecto) */
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const numeroMes = numeroMesMap[mesSeleccionado];
        if (!numeroMes) {
          setActividades([]);
          return;
        }

        const res = await fetch(
          `http://localhost:3001/api/actividades/cumplimiento?mes=${numeroMes}`
        );
        const data = await res.json();

        if (!Array.isArray(data)) {
          message.error("Formato de datos incorrecto.");
          setActividades([]);
          return;
        }

        setActividades(
          data.map((act) => ({
            ...act,
            key: act.id_actividad,
            pesoPorcentual: parseFloat(act.pesoPorcentual) || 0,
            total: parseFloat(act.total) || 0,
            ejecucion: parseFloat(String(act.ejecucion).replace("%", "")) || 0,
            cumplimiento: calcularCumplimiento(act.ejecucion)
          }))
        );
      } catch (err) {
        console.error(err);
        message.error("Error al cargar actividades.");
      }
    };

    fetchDatos();
  }, [mesSeleccionado]);

  /* Abre el modal con las actividades del proyecto elegido */
  const handleProyectoChange = async (codigo) => {
    if (!codigo) return;
    const numeroMes = numeroMesMap[mesSeleccionado];
    try {
      const res = await fetch(
        `http://localhost:3001/api/actividades/cumplimiento?mes=${numeroMes}&proyecto=${codigo}`
      );
      const data = await res.json();

      setDetalleActividades(
        data.map((act) => ({
          ...act,
          key: act.id_actividad,
          pesoPorcentual: parseFloat(act.pesoPorcentual) || 0,
          total: parseFloat(act.total) || 0,
          ejecucion: parseFloat(String(act.ejecucion).replace("%", "")) || 0,
          cumplimiento: calcularCumplimiento(act.ejecucion)
        }))
      );
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar detalle del proyecto.");
    }
  };

  /* Columnas reutilizables para ambas tablas */
  const columnas = [
    { title: "Proyecto", dataIndex: "proyecto", key: "proyecto" },
    { title: "Módulo", dataIndex: "modulo", key: "modulo" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Actividad", dataIndex: "actividad", key: "actividad" },
    {
      title: "Peso Porcentual",
      dataIndex: "pesoPorcentual",
      key: "pesoPorcentual",
      align: "center",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.pesoPorcentual}
          onChange={(v) => {
            const nuevas = actividades.map((a) =>
              a.key === record.key ? { ...a, pesoPorcentual: v } : a
            );
            setActividades(nuevas);
          }}
          step={0.01}
        />
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (_, record) => (
        <Input
          value={record.estado}
          onChange={(e) => {
            const nuevas = actividades.map((a) =>
              a.key === record.key ? { ...a, estado: e.target.value } : a
            );
            setActividades(nuevas);
          }}
        />
      )
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.total}
          formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(val) => val.replace(/\$\s?|(,*)/g, "")}
          onChange={(v) => {
            const nuevas = actividades.map((a) =>
              a.key === record.key ? { ...a, total: v } : a
            );
            setActividades(nuevas);
          }}
          step={0.01}
        />
      )
    },
    {
      title: "Ejecución",
      dataIndex: "ejecucion",
      key: "ejecucion",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.ejecucion}
          onChange={(v) => {
            const ej = parseFloat(v) || 0;
            const nuevas = actividades.map((a) =>
              a.key === record.key
                ? { ...a, ejecucion: ej, cumplimiento: calcularCumplimiento(ej) }
                : a
            );
            setActividades(nuevas);
          }}
          step={0.01}
        />
      )
    },
    {
      title: "Cumplimiento",
      dataIndex: "cumplimiento",
      key: "cumplimiento",
      render: (cumplimiento) => {
        const color = cumplimiento === "Aceptable" ? "#68d391" : "#ed8936";
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
            <Title level={3} className="page-title">
              Seguimiento de Cumplimiento
            </Title>
            <div className="filters">
              <Select
                value={mesSeleccionado}
                onChange={setMesSeleccionado}
                style={{ width: 150, marginRight: 16 }}
              >
                {mesesDelAnio.map((mes) => (
                  <Option key={mes} value={mes}>
                    {mes}
                  </Option>
                ))}
              </Select>

              <Select
                allowClear
                placeholder="Ver detalle de proyecto"
                onChange={handleProyectoChange}
                style={{ width: 220 }}
              >
                {proyectos.map((p) => (
                  <Option key={p.codigo} value={p.codigo}>
                    {p.nombre}
                  </Option>
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

        {/* Modal con actividades del proyecto seleccionado */}
        <Modal
          title="Actividades del proyecto"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={null}
          width={900}
        >
          <Table
            columns={columnas}
            dataSource={detalleActividades}
            bordered
            size="small"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 5 }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Cumplimiento;