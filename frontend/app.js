import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener("DOMContentLoaded", function () {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("viewer").appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);  // Use globally set OrbitControls
    controls.update();

    let currentIndex = 0;
    async function loadPointCloud(url, color, update_camera=false) {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.trim().split("\n");
        const points = new Float32Array(lines.length * 3);
        const colors = new Float32Array(lines.length * 3);
        
        let sumX = 0, sumY = 0, sumZ = 0;
        lines.forEach((line, i) => {
            const [x, y, z, intensity] = line.split(" ").map(parseFloat);
            points[i * 3] = x;
            points[i * 3 + 1] = y;
            points[i * 3 + 2] = z;
            sumX += x;
            sumY += y;
            sumZ += z;
            const normalizedIntensity = intensity / 255;
            colors[i * 3] = color.r * normalizedIntensity;
            colors[i * 3 + 1] = color.g * normalizedIntensity;
            colors[i * 3 + 2] = color.b * normalizedIntensity;
        });

        const numPoints = lines.length;
        const centerX = sumX / numPoints;
        const centerY = sumY / numPoints;
        const centerZ = sumZ / numPoints;
        
        if (update_camera) {
            camera.position.set(centerX, centerY, centerZ + 20);
            controls.target.set(centerX, centerY, centerZ);
            controls.update();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
        const pointCloud = new THREE.Points(geometry, material);
        scene.add(pointCloud);

        return pointCloud;
    }

    const baseURL = "http://localhost:5000/example";
    
    function navigate(direction) {
        fetch(`http://localhost:5000/${direction}`)
        .then(response => response.json())
        .then(data => {
            if (data.index !== undefined) {
                scene.remove.apply(scene, scene.children);
                currentIndex = data.index;
                loadPointCloud(`${baseURL}/${currentIndex}/generated_0`, { r: 1, g: 1, b: 1 }, true);
                loadPointCloud(`${baseURL}/${currentIndex}/generated_1`, { r: 1, g: 1, b: 1 });
                loadPointCloud(`${baseURL}/${currentIndex}/original`, { r: 1, g: 1, b: 1 });
            }
        })
        .catch(error => console.error("Error navigating:", error));
    }

    document.getElementById("prevButton").addEventListener("click", () => navigate("prev"));
    document.getElementById("nextButton").addEventListener("click", () => navigate("next"));

    loadPointCloud(`${baseURL}/${currentIndex}/generated_0`, { r: 1, g: 1, b: 1 }, true);
    loadPointCloud(`${baseURL}/${currentIndex}/generated_1`, { r: 1, g: 1, b: 1 });
    loadPointCloud(`${baseURL}/${currentIndex}/original`, { r: 1, g: 1, b: 1 });
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Adjust point size dynamically
    document.getElementById("pointSize").addEventListener("input", function (event) {
        const size = parseFloat(event.target.value);
        scene.children.forEach((child) => {
            if (child instanceof THREE.Points) {
                child.material.size = size;
            }
        });
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
