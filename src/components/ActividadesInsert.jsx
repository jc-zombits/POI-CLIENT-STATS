"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, InputNumber, Select, message, Modal } from "antd";
import axios from "axios";
import NavigationBar from "./NavBar";
import "../components/styles/ActividadesInsert.css"; // Archivo CSS adicional

const ActividadesInsert = () => {
  const [form] = Form.useForm();
  const [modulos, setModulos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [estadoAutomatico, setEstadoAutomatico] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/modulos");
        const data = await res.json();
        console.log("✅ Módulos obtenidos desde backend:", data);
        setModulos(data);
      } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
        message.error("No se pudieron cargar los módulos");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/maestro-estados");
        const data = await res.json();
        console.log("✅ Estados obtenidos desde backend:", data);
        setEstados(data);
      } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
        message.error("No se pudieron cargar los estados");
      }
    };

    fetchData();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);  // 🌀 Muestra spinner en el botón
    setTimeout(() => setModalVisible(false), 3000);
    try {
      const estadoSeleccionado = estados.find(e => e.descripcion === values.estado);
      if (!estadoSeleccionado) {
        message.error("Estado inválido. No se encontró el código asociado.");
        setLoading(false);
        return;
      }
      setModalVisible(true); 

      const payload = {
        codigo_modulo: String(values.codigo_modulo),
        nombre: String(values.nombre),
        presupuesto: values.presupuesto ? Number(values.presupuesto) : null,
        peso_porcentual: values.peso_porcentual ? Number(values.peso_porcentual) : null,
        estado: String(estadoSeleccionado.codigo)
      };

      console.log("📦 Payload que se envía:", JSON.stringify(payload, null, 2));

      const response = await axios.post("http://localhost:3001/api/actividades", payload);
      console.log("📩 Respuesta del servidor:", response.data);

      message.success("✅ Actividad creada correctamente");
      form.resetFields();
      setEstadoAutomatico("");
    } catch (error) {
      console.groupCollapsed('❌ Error detallado al crear actividad');
      console.error('Mensaje:', error.message);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Configuración de la petición:', error.config);
      console.groupEnd();

      message.error(`❌ Error al crear actividad: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);  // 🛑 Oculta spinner
    }
  };

  console.log("📋 Módulos disponibles:", modulos);

  return (
    <div className="actividades-container">
      <NavigationBar />
      <Modal
        title="Actividad creada"
        visible={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
        okText="Cerrar"
        cancelText="Cancelar"
      >
        <p>✅ La actividad fue registrada exitosamente en el sistema.</p>
      </Modal>
      <div className="form-container mt-24">
        <h2 className="form-title">Crear Nueva Actividad</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="actividades-form"
        >
          <Form.Item
            name="nombre"
            label="Nombre de la Actividad"
            rules={[{ required: true, message: "Ingrese el nombre de la actividad" }]}
          >
            <Input className="form-input" />
          </Form.Item>

          <Form.Item
            name="codigo_modulo"
            label="Código del Módulo"
            rules={[{ required: true, message: "Seleccione el módulo asociado" }]}
          >
            <Select
              showSearch
              placeholder="Seleccione un módulo"
              optionFilterProp="children"
              className="form-select"
              onChange={async (value) => {
                try {
                  const res = await fetch(`http://localhost:3001/api/actividades/estado-por-modulo/${value}`);
                  const data = await res.json();

                  const descripcion = data.estado; // Ej: "Ejecucion", "Espera"
                  setEstadoAutomatico(descripcion); // Muestra al usuario
                  form.setFieldValue("estado", descripcion); // Envía al backend
                } catch (error) {
                  console.error("❌ Error al cargar estado:", error);
                  message.error("No se pudo obtener el estado del proyecto");
                  setEstadoAutomatico("");
                  form.setFieldValue("estado", "");
                }
              }}
            >
              {modulos.map((modulo) => (
                <Select.Option key={modulo.codigo} value={modulo.codigo}>
                  {modulo.codigo} - {modulo.descripcion}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="number-inputs-row">
            <Form.Item
              name="presupuesto"
              label="Presupuesto"
              rules={[{ required: false }]}
              className="number-input"
            >
              <InputNumber
                min={0}
                className="form-number-input"
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>

            <Form.Item
              name="peso_porcentual"
              label="Peso Porcentual"
              rules={[{ required: false }]}
              className="number-input"
            >
              <InputNumber
                min={0}
                max={100}
                step={0.01}
                className="form-number-input"
                addonAfter="%"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="estado"
            label="Estado del Proyecto"
            rules={[{ required: true, message: "El estado es requerido" }]}
          >
            <Input value={estadoAutomatico} disabled className="form-input" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              className="submit-button"
              loading={loading}  // ⬅️ Aquí se activa el spinner
            >
              Guardar Actividad
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ActividadesInsert;