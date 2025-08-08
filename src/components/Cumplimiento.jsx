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
  Button,
  Space,
  Modal,
  Descriptions,
  Tag,
  DatePicker,
} from "antd";
import { SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";
import NavigationBar from "./NavBar";
import "../components/styles/Cumplimiento.css";

const { Title } = Typography;
const { Option } = Select;

const Cumplimiento = () => {
  const [actividades, setActividades] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [hayChangios, setHayChangios] = useState(false);
  const [actividadesOriginales, setActividadesOriginales] = useState([]);
  
  // Estados para el modal de resumen del proyecto
  const [modalVisible, setModalVisible] = useState(false);
  const [proyectoSeleccionadoModal, setProyectoSeleccionadoModal] = useState(null);
  const [resumenProyecto, setResumenProyecto] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  /* Función para calcular el cumplimiento */
  const calcularCumplimiento = (ejecucion) => {
    if (ejecucion >= 80) return "Cumplido";
    if (ejecucion >= 50) return "En Proceso";
    return "No Cumplido";
  };

  /* Función para manejar click en código de proyecto */
  const handleProyectoClick = async (codigoProyecto) => {
    setLoadingResumen(true);
    setModalVisible(true);
    setProyectoSeleccionadoModal(codigoProyecto);
    
    try {
      // Buscar información del proyecto
      const proyectoInfo = proyectos.find(p => p.codigo === codigoProyecto);
      
      // Cargar actividades del proyecto para el resumen
      const response = await fetch(
        `http://localhost:3001/api/actividades/cumplimiento?proyecto=${codigoProyecto}`
      );
      const actividadesProyecto = await response.json();
      
      // Organizar datos por actividad y mes
      const actividadesPorNombre = {};
      const mesesUnicos = new Set();
      
      actividadesProyecto.forEach(actividad => {
        const key = `${actividad.modulo}_${actividad.actividad}`;
        
        if (!actividadesPorNombre[key]) {
          actividadesPorNombre[key] = {
            codigo: codigoProyecto,
            modulo: actividad.modulo,
            descripcion: actividad.descripcion,
            actividad: actividad.actividad,
            pesoPorcentual: actividad.pesoPorcentual,
            estado: actividad.estado,
            meses: {},
            totalActividad: 0,
            promedioEjecucion: 0
          };
        }
        
        // Agregar datos del mes
        actividadesPorNombre[key].meses[actividad.mes] = {
          total: parseFloat(actividad.total) || 0,
          ejecucion: parseFloat(actividad.ejecucion) || 0,
          cumplimiento: actividad.cumplimiento
        };
        
        mesesUnicos.add(actividad.mes);
      });
      
      // Calcular totales por actividad
      Object.keys(actividadesPorNombre).forEach(key => {
        const actividad = actividadesPorNombre[key];
        let totalActividad = 0;
        let sumaEjecucion = 0;
        let contadorMeses = 0;
        
        Object.values(actividad.meses).forEach(mes => {
          totalActividad += mes.total;
          sumaEjecucion += mes.ejecucion;
          contadorMeses++;
        });
        
        actividad.totalActividad = totalActividad;
        actividad.promedioEjecucion = contadorMeses > 0 ? (sumaEjecucion / contadorMeses).toFixed(2) : 0;
      });
      
      // Calcular totales por mes
      const mesesArray = Array.from(mesesUnicos).sort();
      const totalesPorMes = {};
      
      mesesArray.forEach(mes => {
        totalesPorMes[mes] = 0;
        Object.values(actividadesPorNombre).forEach(actividad => {
          if (actividad.meses[mes]) {
            totalesPorMes[mes] += actividad.meses[mes].total;
          }
        });
      });
      
      // Calcular total general del proyecto
      const totalGeneral = Object.values(totalesPorMes).reduce((sum, total) => sum + total, 0);
      
      // Calcular estadísticas generales
      const totalRegistros = actividadesProyecto.length;
      const actividadesCumplidas = actividadesProyecto.filter(a => a.cumplimiento === 'Cumplido').length;
      const actividadesEnProceso = actividadesProyecto.filter(a => a.cumplimiento === 'En Proceso').length;
      const actividadesNoCumplidas = actividadesProyecto.filter(a => a.cumplimiento === 'No Cumplido').length;
      
      const promedioEjecucionGeneral = totalRegistros > 0 
        ? (actividadesProyecto.reduce((sum, a) => sum + (parseFloat(a.ejecucion) || 0), 0) / totalRegistros).toFixed(2)
        : 0;
      
      setResumenProyecto({
        ...proyectoInfo,
        actividadesDetalladas: actividadesPorNombre,
        mesesArray,
        totalesPorMes,
        totalGeneral,
        totalRegistros,
        actividadesCumplidas,
        actividadesEnProceso,
        actividadesNoCumplidas,
        promedioEjecucionGeneral,
        actividadesOriginales: actividadesProyecto
      });
      
    } catch (error) {
      console.error('Error al cargar resumen del proyecto:', error);
      message.error('Error al cargar la información del proyecto');
    } finally {
      setLoadingResumen(false);
    }
  };

  /* Función para detectar cambios */
  const detectarCambios = (nuevasActividades) => {
    const cambios = JSON.stringify(nuevasActividades) !== JSON.stringify(actividadesOriginales);
    setHayChangios(cambios);
  };

  /* Función para actualizar actividades y detectar cambios */
  const actualizarActividades = (nuevasActividades) => {
    setActividades(nuevasActividades);
    detectarCambios(nuevasActividades);
  };

  /* Función para guardar cambios */
  const guardarCambios = async () => {
    if (!proyectoSeleccionado || actividades.length === 0) {
      message.warning('No hay datos para guardar');
      return;
    }

    setGuardando(true);
    
    // Mostrar mensaje de progreso
    message.loading('Guardando cambios...');
    
    try {
      let totalRegistrosActualizados = 0;

      if (proyectoSeleccionado === 'TODOS') {
        // Agrupar actividades por proyecto
        const actividadesPorProyecto = actividades.reduce((acc, actividad) => {
          const proyecto = actividad.proyecto;
          if (!acc[proyecto]) {
            acc[proyecto] = [];
          }
          acc[proyecto].push({
            ...actividad,
            cumplimiento: parseFloat(actividad.ejecucion) || 0
          });
          return acc;
        }, {});

        // Guardar cada proyecto por separado
        for (const [codigoProyecto, actividadesProyecto] of Object.entries(actividadesPorProyecto)) {
          const response = await fetch('http://localhost:3001/api/actividades/cumplimiento', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proyecto: codigoProyecto,
              actividades: actividadesProyecto
            }),
          });

          if (response.ok) {
            const result = await response.json();
            totalRegistrosActualizados += result.registrosActualizados;
          } else {
            const error = await response.json();
            throw new Error(`Error en proyecto ${codigoProyecto}: ${error.error || error.details}`);
          }
        }
      } else {
        // Guardar un solo proyecto
        const actividadesParaGuardar = actividades.map(actividad => ({
          ...actividad,
          cumplimiento: parseFloat(actividad.ejecucion) || 0
        }));

        const response = await fetch('http://localhost:3001/api/actividades/cumplimiento', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proyecto: proyectoSeleccionado,
            actividades: actividadesParaGuardar
          }),
        });

        if (response.ok) {
          const result = await response.json();
          totalRegistrosActualizados = result.registrosActualizados;
        } else {
          const error = await response.json();
          throw new Error(`Error al guardar: ${error.error || error.details || 'Error desconocido'}`);
        }
      }

      message.success(`Cambios guardados exitosamente. ${totalRegistrosActualizados} registros actualizados.`);
      
      // Recargar los datos desde el servidor para reflejar los cambios
      if (proyectoSeleccionado === 'TODOS') {
        await cargarTodosLosProyectos();
      } else {
        await handleProyectoChange(proyectoSeleccionado);
      }

    } catch (error) {
      console.error('Error al guardar cambios:', error);
      message.error(error.message || 'Error de conexión al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  /* Cargar proyectos al montar el componente */
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/proyectos");
        const data = await response.json();
        setProyectos(data);
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
      }
    };
    cargarProyectos();
  }, []);

  /* Función para cargar todos los proyectos */
  const cargarTodosLosProyectos = async () => {
    setLoading(true);
    try {
      const todasLasActividades = [];
      
      for (const proyecto of proyectos) {
        const response = await fetch(
          `http://localhost:3001/api/actividades/cumplimiento?proyecto=${proyecto.codigo}`
        );
        const data = await response.json();
        todasLasActividades.push(...data);
      }
      
      setActividades(todasLasActividades);
      setActividadesOriginales([...todasLasActividades]);
      setHayChangios(false);
    } catch (error) {
      console.error("Error al cargar actividades de todos los proyectos:", error);
      setActividades([]);
      setActividadesOriginales([]);
      setHayChangios(false);
    } finally {
      setLoading(false);
    }
  };

  /* Función para manejar el cambio de proyecto */
  const handleProyectoChange = async (codigoProyecto) => {
    setProyectoSeleccionado(codigoProyecto);
    
    if (!codigoProyecto) {
      setActividades([]);
      setActividadesOriginales([]);
      setHayChangios(false);
      return;
    }

    if (codigoProyecto === 'TODOS') {
      await cargarTodosLosProyectos();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/actividades/cumplimiento?proyecto=${codigoProyecto}`
      );
      const data = await response.json();
      setActividades(data);
      setActividadesOriginales([...data]); // Guardar copia original
      setHayChangios(false);
    } catch (error) {
      console.error("Error al cargar actividades del proyecto:", error);
      setActividades([]);
      setActividadesOriginales([]);
      setHayChangios(false);
    } finally {
      setLoading(false);
    }
  };

  /* Columnas de la tabla */
  const columnas = [
    // Mostrar columna de proyecto solo cuando se ven todos los proyectos
    ...(proyectoSeleccionado === 'TODOS' ? [
      { 
        title: "Proyecto", 
        dataIndex: "proyecto", 
        key: "proyecto", 
        width: 100,
        render: (codigoProyecto) => (
          <Button
            type="link"
            onClick={() => handleProyectoClick(codigoProyecto)}
            style={{ 
              padding: 0, 
              height: 'auto',
              color: '#1890ff',
              fontWeight: 500,
              textDecoration: 'underline'
            }}
            icon={<InfoCircleOutlined style={{ fontSize: '12px', marginRight: '4px' }} />}
          >
            {codigoProyecto}
          </Button>
        )
      }
    ] : []),
    { title: "Módulo", dataIndex: "modulo", key: "modulo", width: 100 },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion", width: 250 },
    { title: "Actividad", dataIndex: "actividad", key: "actividad", width: 200 },
    { title: "Mes", dataIndex: "mes", key: "mes", width: 120 },
    {
      title: "Peso Porcentual",
      dataIndex: "pesoPorcentual",
      key: "pesoPorcentual",
      width: 140,
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
            actualizarActividades(nuevas);
          }}
          step={0.01}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (_, record) => (
        <Input
          value={record.estado}
          onChange={(e) => {
            const nuevas = actividades.map((a) =>
              a.key === record.key ? { ...a, estado: e.target.value } : a
            );
            actualizarActividades(nuevas);
          }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 120,
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
            actualizarActividades(nuevas);
          }}
          step={0.01}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "Ejecución",
      dataIndex: "ejecucion",
      key: "ejecucion",
      width: 120,
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
            actualizarActividades(nuevas);
          }}
          step={0.01}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "Cumplimiento",
      dataIndex: "cumplimiento",
      key: "cumplimiento",
      width: 120,
      render: (cumplimiento) => {
        let color = "#ed8936"; // No Cumplido - naranja
        if (cumplimiento === "Cumplido") color = "#68d391"; // verde
        else if (cumplimiento === "En Proceso") color = "#4299e1"; // azul
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
              <Space size="middle">
                <Select
                  allowClear
                  placeholder="Seleccionar proyecto"
                  value={proyectoSeleccionado}
                  onChange={handleProyectoChange}
                  style={{ width: 300 }}
                >
                  <Option key="TODOS" value="TODOS">
                    📊 Todos los proyectos
                  </Option>
                  {proyectos.map((p) => (
                    <Option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.nombre}
                    </Option>
                  ))}
                </Select>
                
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={guardarCambios}
                  loading={guardando}
                  disabled={!hayChangios || !proyectoSeleccionado}
                  style={{ 
                    backgroundColor: hayChangios ? '#1890ff' : undefined,
                    borderColor: hayChangios ? '#1890ff' : undefined
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                
                {hayChangios && (
                  <span style={{ color: '#faad14', fontSize: '12px' }}>
                    ⚠️ Hay cambios sin guardar
                  </span>
                )}
              </Space>
            </div>
          </div>

          <Table
            className="cumplimiento-table"
            columns={columnas}
            dataSource={actividades}
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 15 }}
            loading={loading}
            locale={{
              emptyText: proyectoSeleccionado 
                ? "No hay actividades para este proyecto" 
                : "Seleccione un proyecto para ver las actividades"
            }}
          />
        </Card>

        {/* Modal de Resumen del Proyecto */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span>Resumen Detallado del Proyecto: {proyectoSeleccionadoModal}</span>
            </div>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setProyectoSeleccionadoModal(null);
            setResumenProyecto(null);
          }}
          footer={[
            <Button 
              key="close" 
              onClick={() => {
                setModalVisible(false);
                setProyectoSeleccionadoModal(null);
                setResumenProyecto(null);
              }}
            >
              Cerrar
            </Button>
          ]}
          width={1200}
          loading={loadingResumen}
          style={{ top: 20 }}
        >
          {resumenProyecto && (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Información General */}
              <Descriptions 
                title="Información General del Proyecto" 
                bordered 
                column={3}
                size="small"
                style={{ marginBottom: '20px' }}
              >
                <Descriptions.Item label="Código">
                  <Tag color="blue">{resumenProyecto.codigo}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nombre">
                  {resumenProyecto.nombre}
                </Descriptions.Item>
                <Descriptions.Item label="Total Registros">
                  <Tag color="default">{resumenProyecto.totalRegistros}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Promedio Ejecución General">
                  <Tag color={resumenProyecto.promedioEjecucionGeneral >= 80 ? 'green' : resumenProyecto.promedioEjecucionGeneral >= 50 ? 'orange' : 'red'}>
                    {resumenProyecto.promedioEjecucionGeneral}%
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Presupuesto Total">
                  <Tag color="gold">
                    ${resumenProyecto.totalGeneral.toLocaleString('es-CO')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Estado General">
                  <Space>
                    <Tag color="green">Cumplidas: {resumenProyecto.actividadesCumplidas}</Tag>
                    <Tag color="orange">En Proceso: {resumenProyecto.actividadesEnProceso}</Tag>
                    <Tag color="red">No Cumplidas: {resumenProyecto.actividadesNoCumplidas}</Tag>
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              {/* Totales por Mes */}
               <Card 
                 title="💰 Totales por Mes" 
                 size="small" 
                 style={{ marginBottom: '20px' }}
                 styles={{ body: { padding: '12px' } }}
               >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {resumenProyecto.mesesArray.map(mes => (
                    <Tag key={mes} color="cyan" style={{ margin: '2px', fontSize: '12px' }}>
                      <strong>{mes}:</strong> ${resumenProyecto.totalesPorMes[mes].toLocaleString('es-CO')}
                    </Tag>
                  ))}
                </div>
              </Card>

              {/* Detalle por Actividades */}
               <Card 
                 title="📋 Detalle por Actividades y Meses" 
                 size="small"
                 styles={{ body: { padding: '12px' } }}
               >
                <Table
                  dataSource={Object.keys(resumenProyecto.actividadesDetalladas).map((key, index) => ({
                    key: index,
                    ...resumenProyecto.actividadesDetalladas[key]
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: 'Módulo',
                      dataIndex: 'modulo',
                      key: 'modulo',
                      width: 80,
                      fixed: 'left',
                      render: (text) => <Tag color="blue">{text}</Tag>
                    },
                    {
                      title: 'Actividad',
                      dataIndex: 'actividad',
                      key: 'actividad',
                      width: 200,
                      fixed: 'left',
                      render: (text) => <strong>{text}</strong>
                    },
                    {
                      title: 'Peso %',
                      dataIndex: 'pesoPorcentual',
                      key: 'pesoPorcentual',
                      width: 80,
                      align: 'center',
                      render: (value) => `${value}%`
                    },
                    {
                      title: 'Estado',
                      dataIndex: 'estado',
                      key: 'estado',
                      width: 100,
                      render: (estado) => (
                        <Tag color={estado === 'Cumplido' ? 'green' : estado === 'En Proceso' ? 'orange' : 'default'}>
                          {estado}
                        </Tag>
                      )
                    },
                    ...resumenProyecto.mesesArray.map(mes => ({
                      title: mes,
                      key: mes,
                      width: 120,
                      align: 'center',
                      render: (_, record) => {
                        const mesData = record.meses[mes];
                        if (!mesData) return <span style={{ color: '#ccc' }}>-</span>;
                        return (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1890ff' }}>
                              ${mesData.total.toLocaleString('es-CO')}
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>
                              {mesData.ejecucion}% ejec.
                            </div>
                          </div>
                        );
                      }
                    })),
                    {
                      title: 'Total Actividad',
                      key: 'totalActividad',
                      width: 120,
                      align: 'center',
                      fixed: 'right',
                      render: (_, record) => (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a' }}>
                            ${record.totalActividad.toLocaleString('es-CO')}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            Prom: {record.promedioEjecucion}%
                          </div>
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Cumplimiento;