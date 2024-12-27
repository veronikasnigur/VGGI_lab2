// model.js
function Model(a, p, uSegments, vSegments) {
    this.a = a;
    this.p = p;
    this.uSegments = uSegments;
    this.vSegments = vSegments;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;
    this.countIndices = 0;

    // Параметричні рівняння поверхні
    this.surfaceFunction = function(u, v) {
        let omega = this.p * u;
        let x = (this.a + v) * Math.cos(omega) * Math.cos(u);
        let y = (this.a + v) * Math.cos(omega) * Math.sin(u);
        let z = (this.a + v) * Math.sin(omega);
        return [x, y, z];
    };

    this.generateSurfaceData = function() {
        let vertices = [];
        let indices = [];
        let flatNormals = [];
        let uSteps = this.uSegments;
        let vSteps = this.vSegments;
        let uMin = -Math.PI, uMax = Math.PI;
        let vMin = -this.a, vMax = 0;
    
        // Генерація вершин
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * i / uSteps;
    
            for (let j = 0; j <= vSteps; j++) {
                let v = vMin + (vMax - vMin) * j / vSteps;
                let vertex = this.surfaceFunction(u, v);
                vertices.push(...vertex);
                flatNormals.push(0, 0, 0);  // Ініціалізуємо масив нормалей для кожної вершини
            }
        }
    
        // Генерація індексів для трикутників та обчислення нормалей
        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                let idx = i * (vSteps + 1) + j;
                let nextIdx = (i + 1) * (vSteps + 1) + j;
    
                // Перший трикутник
                indices.push(idx, idx + 1, nextIdx);
    
                // Другий трикутник
                indices.push(idx + 1, nextIdx + 1, nextIdx);
    
                // Обчислення нормалей для кожної вершини трикутника
                let v0 = vertices.slice(idx * 3, idx * 3 + 3);
                let v1 = vertices.slice((idx + 1) * 3, (idx + 1) * 3 + 3);
                let v2 = vertices.slice(nextIdx * 3, nextIdx * 3 + 3);
    
                let edge1 = [
                    v1[0] - v0[0],
                    v1[1] - v0[1],
                    v1[2] - v0[2],
                ];
                let edge2 = [
                    v2[0] - v0[0],
                    v2[1] - v0[1],
                    v2[2] - v0[2],
                ];
                let normal = [
                    edge1[1] * edge2[2] - edge1[2] * edge2[1],
                    edge1[2] * edge2[0] - edge1[0] * edge2[2],
                    edge1[0] * edge2[1] - edge1[1] * edge2[0],
                ];
                let length = Math.sqrt(
                    normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2
                );
    
                // Додано перевірку на нульову довжину нормалі
                if (length === 0) {
                    normal = [0, 0, 1]; // Вектор за замовчуванням (вгору)
                } else {
                    normal = normal.map((n) => n / length); // Нормалізація
                }
    
                // Додаємо нормалі для кожної вершини
                flatNormals[idx * 3] += normal[0];
                flatNormals[idx * 3 + 1] += normal[1];
                flatNormals[idx * 3 + 2] += normal[2];
    
                flatNormals[(idx + 1) * 3] += normal[0];
                flatNormals[(idx + 1) * 3 + 1] += normal[1];
                flatNormals[(idx + 1) * 3 + 2] += normal[2];
    
                flatNormals[nextIdx * 3] += normal[0];
                flatNormals[nextIdx * 3 + 1] += normal[1];
                flatNormals[nextIdx * 3 + 2] += normal[2];
            }
        }
    
        // Нормалізація нормалей
        for (let i = 0; i < flatNormals.length; i += 3) {
            let length = Math.sqrt(
                flatNormals[i] ** 2 + flatNormals[i + 1] ** 2 + flatNormals[i + 2] ** 2
            );
    
            if (length !== 0) {
                flatNormals[i] /= length;
                flatNormals[i + 1] /= length;
                flatNormals[i + 2] /= length;
            }
        }
    
        // Замикання по u
        for (let j = 0; j < vSteps; j++) {
            let idx1 = j;
            let idx2 = j + 1;
            let idx1LastRow = uSteps * (vSteps + 1) + j;
            let idx2LastRow = uSteps * (vSteps + 1) + j + 1;
    
            indices.push(idx1, idx2, idx1LastRow);       // Трикутник для замикання
            indices.push(idx2, idx2LastRow, idx1LastRow); // Трикутник для замикання
        }
    
        // Замикання по v
        for (let i = 0; i < uSteps; i++) {
            let idx1 = i * (vSteps + 1);
            let idx2 = (i + 1) * (vSteps + 1);
            let idx1LastCol = i * (vSteps + 1) + vSteps;
            let idx2LastCol = (i + 1) * (vSteps + 1) + vSteps;
    
            indices.push(idx1LastCol, idx2LastCol, idx1);       // Трикутник для замикання
            indices.push(idx2LastCol, idx2, idx1); // Трикутник для замикання
        }
    
        return { vertices, indices, flatNormals };
    };
    
    

    this.BufferData = function() {
        let surfaceData = this.generateSurfaceData();

        // Діагностика: перевірка вершин і індексів
        console.log("Vertices:", surfaceData.vertices);
        console.log("Indices:", surfaceData.indices);

        // Буфер вершин
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.vertices), gl.STATIC_DRAW);
        this.count = surfaceData.vertices.length / 3;

        // Буфер індексів
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.indices), gl.STATIC_DRAW);
        this.countIndices = surfaceData.indices.length;

        // Буфер нормалей для Flat Shading
        this.iFlatNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iFlatNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.flatNormals), gl.STATIC_DRAW);
    };

    this.Draw = function() {
        // Вершини
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        // Нормалі
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iFlatNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribFlatNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribFlatNormal);

        // Малюємо поверхню
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.countIndices, gl.UNSIGNED_SHORT, 0);
    };
}