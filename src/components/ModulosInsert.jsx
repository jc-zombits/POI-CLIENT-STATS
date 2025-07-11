"use client";
import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Table, Modal, Space, Tag, Select  } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from "axios";
import NavigationBar from "./NavBar";
import "../components/styles/ModulosInsert.css";

const { Option } = Select;

const ModulosInsert = () => {
  const [form] = Form.useForm();
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    fetchModulos();
    fetchProyectos();
  }, []);

  const fetchModulos = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/modulos");
      
      // Asegurarnos que siempre sea un array
      const data = Array.isArray(response.data) ? response.data : [];
      
      setModulos(data);
    } catch (error) {
      console.error("Error al obtener módulos:", error);
      message.error("Error al cargar los módulos");
      setModulos([]); // Falla segura
    } finally {
      setLoading(false);
    }
  };

  const fetchProyectos = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/proyectos");
      setProyectos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
      message.error("Error al cargar la lista de proyectos");
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:3001/api/maestro-modulos", 
        values
      );

      message.success(`Módulo "${response.data?.descripcion}" creado correctamente`);
      form.resetFields();
      fetchModulos();
    } catch (error) {
      console.error("Error al insertar módulo:", error);
      message.error(error.response?.data?.message || "No se pudo crear el módulo");
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar la actualización
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { codigo, ...updateData } = currentModule;
      
      const response = await axios.put(
        `http://localhost:3001/api/modulo/${codigo}`,
        updateData
      );

      message.success('Módulo actualizado correctamente');
      setEditModalVisible(false);
      fetchModulos(); // Refrescar la lista
    } catch (error) {
      console.error('Error al actualizar módulo:', error);
      message.error(error.response?.data?.error || 'Error al actualizar el módulo');
    } finally {
      setLoading(false);
    }
  };

  // Columnas actualizadas
  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Proyecto',
      dataIndex: 'nombre_proyecto', // Cambiado a nombre_proyecto
      key: 'codigo_proyecto',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedModule(record);
              setModalVisible(true);
            }}
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (module) => {
    setCurrentModule(module);         // Guardar datos en el estado
    setEditModalVisible(true);       // Mostrar el modal de edición
  };

  const handleDelete = (codigo) => {
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: `¿Estás seguro de eliminar el módulo ${codigo}?`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          message.warning('Función de eliminación en desarrollo');
        } catch (error) {
          message.error('Error al intentar eliminar');
        }
      }
    });
  };

  return (
    <div className="modulos-container">
      <NavigationBar />
      
      <div className="modulos-content">
        <div className="form-container">
          <h2 className="form-title">Crear Nuevo Módulo</h2>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="codigo"
              label="Código del Módulo"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="descripcion"
              label="Descripción"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="codigo_proyecto"
              label="Código del Proyecto"
              rules={[{ required: true }]}
            >
              <Select placeholder="Seleccione un proyecto">
                {proyectos.map(p => (
                  <Option key={p.codigo} value={p.codigo}>
                    {p.codigo} - {p.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Guardar Módulo
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="table-container">
          <h2>Módulos Existentes</h2>
          <Table
            columns={columns}
            dataSource={modulos}
            rowKey="codigo"
            loading={loading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </div>

      <Modal
        title={`Detalles del Módulo ${selectedModule?.codigo}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedModule && (
          <div className="module-details">
            <p><strong>Código:</strong> {selectedModule.codigo}</p>
            <p><strong>Descripción:</strong> {selectedModule.descripcion}</p>
            <p><strong>Proyecto:</strong> {selectedModule.nombre_proyecto}</p>
          </div>
        )}
      </Modal>
      <Modal
        title={`Editar Módulo ${currentModule?.codigo}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdate}
        confirmLoading={loading}
      >
        {currentModule && (
          <Form layout="vertical">
            <Form.Item label="Código">
              <Input value={currentModule.codigo} disabled />
            </Form.Item>
            <Form.Item label="Descripción">
              <Input.TextArea
                rows={4}
                value={currentModule.descripcion}
                onChange={(e) => setCurrentModule({
                  ...currentModule,
                  descripcion: e.target.value
                })}
              />
            </Form.Item>
            <Form.Item label="Código del Proyecto">
              <Input
                value={currentModule.codigo_proyecto}
                onChange={(e) => setCurrentModule({
                  ...currentModule,
                  codigo_proyecto: e.target.value
                })}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ModulosInsert;