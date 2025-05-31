// SHN Trackpad v13 - Enhanced Session List View with Filter and Delete Controls
import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Group } from "react-konva";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";

export default function Trackpad() {
  const [templates, setTemplates] = useState({});
  const [slides, setSlides] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentLine, setCurrentLine] = useState([]);
  const [drawingMode, setDrawingMode] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [sport, setSport] = useState("football");
  const stageRef = useRef();

  const current = slides[activeSlide] || { elements: [], lines: [], note: "", sport };

  const updateCurrent = (updated) => {
    const updatedSlides = slides.map((s, i) => i === activeSlide ? { ...s, ...updated } : s);
    setSlides(updatedSlides);
  };

  const addElement = (type) => {
    const newElement = {
      id: Date.now(),
      type,
      x: 100 + slides[activeSlide]?.elements?.length * 30,
      y: 100,
      color: type === "player" ? "#007bff" : "orange",
      label: type === "player" ? `P${slides[activeSlide]?.elements?.length + 1}` : ""
    };
    updateCurrent({ elements: [...current.elements, newElement] });
  };

  const addSlide = () => {
    setSlides([...slides, { elements: [], lines: [], note: "", sport }]);
    setActiveSlide(slides.length);
  };

  const exportToImage = async () => {
    const canvas = await html2canvas(stageRef.current.getStage().container());
    const dataUrl = canvas.toDataURL();
    const link = document.createElement("a");
    link.download = `slide-${activeSlide + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportAllToPDF = async () => {
    const pdf = new jsPDF();
    for (let i = 0; i < slides.length; i++) {
      setActiveSlide(i);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(stageRef.current.getStage().container());
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, 10, 180, 90);
    }
    pdf.save("shn-trackpad-session.pdf");
  };

  const clearSlide = () => {
    updateCurrent({ elements: [], lines: [], note: "", sport });
  };

  const insertTemplate = () => {
    if (selectedTemplate && templates[selectedTemplate]) {
      updateCurrent({ ...templates[selectedTemplate] });
    }
  };

  const handleStageClick = () => {
    if (drawingMode === "line") {
      const pos = stageRef.current.getPointerPosition();
      const updatedLine = [...currentLine, pos.x, pos.y];
      if (updatedLine.length >= 4) {
        updateCurrent({ lines: [...current.lines, updatedLine] });
        setCurrentLine([]);
        setDrawingMode(null);
      } else {
        setCurrentLine(updatedLine);
      }
    }
  };

  const handleStageDblClick = () => {
    if (drawingMode === "line") {
      setCurrentLine([]);
      setDrawingMode(null);
    }
  };

  const handleLabelChange = (id, newLabel) => {
    const updated = current.elements.map(el => el.id === id ? { ...el, label: newLabel } : el);
    updateCurrent({ elements: updated });
  };

  const handleColorChange = (id) => {
    const updated = current.elements.map(el => el.id === id ? { ...el, color: el.color === "red" ? "#007bff" : "red" } : el);
    updateCurrent({ elements: updated });
  };

  const saveSessionToBackend = async () => {
    const payload = { data: slides, sport };
    try {
      await axios.post("/api/session/save", payload);
      alert("Session saved to cloud.");
    } catch {
      alert("Save failed.");
    }
  };
}
