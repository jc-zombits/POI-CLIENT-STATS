"use client"
import React, { useEffect, useState } from "react";
import { Form, Input, Button, DatePicker, message, Select, Table, Modal, Space, Tag, Card, Divider } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from "axios";
import dayjs from 'dayjs';
import NavigationBar from "./NavBar";
import "../components/styles/ProyectosInsert.css";

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

axios.interceptors.response.use(
  response => {
    if (response.data && !Array.isArray(response.data) && response.config.url.includes('/proyectos')) {
      return { 
        ...response, 
        data: Object.values(response.data) || [] 
      };
    }
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);

const ProyectosInsert = () => {
  const [form] = Form.useForm();
  const [estados, setEstados] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [loading, setLoading] = useState(false);

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [estadosRes, proyectosRes] = await Promise.all([
          axios.get("http://localhost:3001/api/maestro-estados"),
          axios.get("http://localhost:3001/api/proyectos")
        ]);

        // Validación exhaustiva
        const estadosData = Array.isArray(estadosRes?.data) ? estadosRes.data : [];
        let proyectosData = [];

        // Manejar diferentes formatos de respuesta
        if (Array.isArray(proyectosRes?.data)) {
          proyectosData = proyectosRes.data;
        } else if (proyectosRes?.data && typeof proyectosRes.data === 'object') {
          // Si es un objeto, convertirlo a array
          proyectosData = Object.values(proyectosRes.data);
        }

        setEstados(estadosData);
        setProyectos(proyectosData);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        message.error("Error al cargar los datos");
        setEstados([]);
        setProyectos([]); // Asegurar array vacío en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejar creación/actualización
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        fecha_inicio: values.fecha_inicio.format("YYYY-MM-DD"),
        fecha_fin: values.fecha_fin.format("YYYY-MM-DD"),
      };

      if (editingId) {
        const response = await axios.put(
          `http://localhost:3001/api/proyecto/${editingId}`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        message.success("Proyecto actualizado correctamente");
      } else {
        await axios.post("http://localhost:3001/api/maestro-proyectos", payload);
        message.success("Proyecto creado correctamente");
      }

      // Refrescar datos
      const response = await axios.get("http://localhost:3001/api/proyectos");
      setProyectos(response.data || []);
      
      // Resetear formulario
      form.resetFields();
      setEditingId(null);
    } catch (error) {
      console.error("Error al guardar proyecto:", error);
      
      let errorMessage = "No se pudo guardar el proyecto";
      if (error.response) {
        // El servidor respondió con un status code fuera del rango 2xx
        errorMessage = error.response.data.error || 
                    error.response.data.message || 
                    error.response.statusText;
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = "No se recibió respuesta del servidor";
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProyecto = async (codigo) => {
    try {
      console.log('[DELETE] Eliminando proyecto:', codigo);
      
      // 1. Eliminar el proyecto
      const deleteResponse = await axios.delete(
        `http://localhost:3001/api/proyecto/${codigo}`
      );
      console.log('[DELETE] Respuesta:', deleteResponse.data);

      // 2. Actualización OPTIMISTA del estado (elimina localmente primero)
      setProyectos(prev => prev.filter(p => p.codigo !== codigo));
      
      // 3. Refrescar datos del servidor
      try {
        const { data } = await axios.get('http://localhost:3001/api/proyectos');
        if (!Array.isArray(data)) {  // Aquí estaba el error
          throw new Error('La respuesta no es un array');
        }
        console.log('[GET] Proyectos actualizados:', data);
      } catch (getError) {
        console.error('[GET] Error al refrescar:', getError.message);
        // Si falla el GET, mantener la eliminación optimista
      }
      
      message.success(deleteResponse.data.mensaje);
      return true;
    } catch (error) {
      console.error('[DELETE] Error completo:', {
        message: error.message,
        response: error.response?.data
      });

      // Revertir eliminación optimista si falla
      const { data } = await axios.get('http://localhost:3001/api/proyectos');
      setProyectos(Array.isArray(data) ? data : []);
      
      message.error(error.response?.data?.error || 'Error al eliminar');
      return false;
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'Activo' ? 'green' : 'red'}>{estado}</Tag>
      ),
      filters: estados.map(e => ({ text: e.descripcion, value: e.descripcion })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'fecha_inicio',
      key: 'fecha_inicio',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'fecha_fin',
      key: 'fecha_fin',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setViewingProject(record);
              setIsModalVisible(true);
            }}
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              form.setFieldsValue({
                ...record,
                fecha_inicio: dayjs(record.fecha_inicio),
                fecha_fin: dayjs(record.fecha_fin)
              });
              setEditingId(record.codigo);
            }}
          />
          <Button 
            icon={<DeleteOutlined />}
            danger
            onClick={async () => {
              console.log('Record en eliminar:', record);
              const confirmed = window.confirm(`¿Estás seguro de eliminar el proyecto "${record.nombre}"?`);
              if (confirmed) {
                const success = await eliminarProyecto(record.codigo);
                if (!success) {
                  const { data } = await axios.get('http://localhost:3001/api/proyectos');
                  setProyectos(Array.isArray(data) ? data : []);
                }
              }
            }}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="app-container">
      <NavigationBar />
      
      <div className="main-content-container">
        {/* Contenedor principal del formulario y tabla */}
        <div className="form-and-table-container">
          {/* Card del formulario - más compacto y con sombra */}
          <Card 
            title={editingId ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
            className="form-card"
            styles={{
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px',
              fontSize: '18px',
              fontWeight: '500'
            }}
            Styles={{
              padding: '24px'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="compact-form"
            >
              <div className="form-grid">
                <Form.Item
                  name="codigo"
                  label="Código"
                  rules={[{ required: true, message: 'Ingrese el código' }]}
                  className="form-item"
                >
                  <Input disabled={!!editingId} />
                </Form.Item>

                <Form.Item
                  name="nombre"
                  label="Nombre"
                  rules={[{ required: true, message: 'Ingrese el nombre' }]}
                  className="form-item"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="estado"
                  label="Estado"
                  rules={[{ required: true, message: 'Seleccione estado' }]}
                  className="form-item"
                >
                  <Select
                    placeholder="Seleccione un estado"
                    showSearch
                    optionFilterProp="children"
                    className="form-select"
                  >
                    {estados.map((estado) => (
                      <Option key={estado.codigo} value={estado.codigo}>
                        {estado.descripcion}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="responsable"
                  label="Responsable"
                  rules={[{ required: true, message: 'Ingrese responsable' }]}
                  className="form-item"
                >
                  <Input />
                </Form.Item>
              </div>

              <Form.Item 
                name="descripcion" 
                label="Descripción"
                className="description-item"
              >
                <TextArea rows={2} />
              </Form.Item>

              <div className="date-fields">
                <Form.Item
                  name="fecha_inicio"
                  label="Fecha Inicio"
                  rules={[{ required: true, message: 'Seleccione fecha inicio' }]}
                  className="date-item"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="fecha_fin"
                  label="Fecha Fin"
                  rules={[{ required: true, message: 'Seleccione fecha fin' }]}
                  className="date-item"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </div>

              <Form.Item className="form-actions">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ minWidth: '120px' }}
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                {editingId && (
                  <Button 
                    onClick={() => {
                      form.resetFields();
                      setEditingId(null);
                    }}
                    style={{ marginLeft: '12px', minWidth: '120px' }}
                  >
                    Cancelar
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>

          {/* Card de la tabla - diseño profesional */}
          <Card 
            title="Listado de Proyectos"
            className="table-card"
            Styles={{
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px',
              fontSize: '18px',
              fontWeight: '500'
            }}
            bodyStyle={{
              padding: '0'
            }}
          >
            <Table 
              columns={columns} 
              dataSource={Array.isArray(proyectos) ? proyectos : []}
              rowKey={(record) => record?.codigo || Math.random().toString(36).substring(2, 9)}
              loading={loading}
              pagination={{ 
                pageSize: 5,
                showSizeChanger: false,
                position: ['bottomCenter']
              }}
              locale={{
                emptyText: 'No hay proyectos disponibles'
              }}
              scroll={{ x: true }}
              className="projects-table"
            />
          </Card>
        </div>

        {/* Modal de detalles */}
        <Modal
          title="Detalles del Proyecto"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={600}
          centered
        >
          {viewingProject && (
            <div className="project-details">
              <div className="detail-row">
                <span className="detail-label">Código:</span>
                <span className="detail-value">{viewingProject.codigo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Nombre:</span>
                <span className="detail-value">{viewingProject.nombre}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Descripción:</span>
                <span className="detail-value">{viewingProject.descripcion || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha Inicio:</span>
                <span className="detail-value">{dayjs(viewingProject.fecha_inicio).format('DD/MM/YYYY')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha Fin:</span>
                <span className="detail-value">{dayjs(viewingProject.fecha_fin).format('DD/MM/YYYY')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Estado:</span>
                <span className="detail-value">
                  <Tag color={viewingProject.estado === 'Activo' ? 'green' : 'red'}>
                    {viewingProject.estado}
                  </Tag>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Responsable:</span>
                <span className="detail-value">{viewingProject.responsable}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProyectosInsert;