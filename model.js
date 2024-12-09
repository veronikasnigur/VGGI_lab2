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

    // Генерація даних для поверхні та індексів
    this.generateSurfaceData = function() {
        let vertices = [];
        let indices = [];
        let uSteps = this.uSegments;
        let vSteps = this.vSegments;
        let uMin = -Math.PI, uMax = Math.PI;  
        let vMin = -this.a, vMax = 0;  // Встановимо діапазон для v

        // Генерація вершин для трикутників
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * i / uSteps;
            let omega = this.p * u;

            for (let j = 0; j <= vSteps; j++) {
                let v = vMin + (vMax - vMin) * j / vSteps;

                let vertex = this.surfaceFunction(u, v);
                vertices.push(...vertex);
            }
        }

        // Генерація індексів для трикутників
        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                let idx = i * (vSteps + 1) + j;
                let nextIdx = idx + vSteps + 1;

                if (idx < vertices.length / 3 && nextIdx < vertices.length / 3) {
                    indices.push(idx, idx + 1, nextIdx);
                    indices.push(idx + 1, nextIdx + 1, nextIdx);
                }
            }
        }
        return { vertices, indices };
    };

    // Заповнення буферу WebGL
    this.BufferData = function() {
        let surfaceData = this.generateSurfaceData();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.vertices), gl.STATIC_DRAW);
        this.count = surfaceData.vertices.length / 3;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.indices), gl.STATIC_DRAW);
        this.countIndices = surfaceData.indices.length;
    };

    // Малювання трикутників
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.countIndices, gl.UNSIGNED_SHORT, 0);
    };

    // Малювання ліній для U і V
    this.DrawLines = function() {
        let uStep = 2 * Math.PI / this.uSegments;
        let vStep = 2 / this.vSegments;

        // Малювання ліній для U
        for (let i = 0; i < this.uSegments; i++) {
            for (let j = 0; j < this.vSegments; j++) {
                let u1 = i * uStep;
                let u2 = (i + 1) * uStep;
                let v1 = j * vStep;
                let v2 = (j + 1) * vStep;

                let vertex1 = this.surfaceFunction(u1, v1);
                let vertex2 = this.surfaceFunction(u2, v2);

                // Малюємо лінії між двома точками
                gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1]); // Червоний для U
                gl.drawArrays(gl.LINES, 0, 2); // Малюємо лінію між двома точками
            }
        }

        // Малювання ліній для V
        for (let j = 0; j < this.vSegments; j++) {
            for (let i = 0; i < this.uSegments; i++) {
                let u1 = i * uStep;
                let u2 = (i + 1) * uStep;
                let v1 = j * vStep;
                let v2 = (j + 1) * vStep;

                let vertex1 = this.surfaceFunction(u1, v1);
                let vertex2 = this.surfaceFunction(u2, v2);

                // Малюємо лінії між двома точками
                gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]); // Синій для V
                gl.drawArrays(gl.LINES, 0, 2); // Малюємо лінію між двома точками
            }
        }
    };
}
