import * as THREE from 'three';

class Game {
    constructor() {
        console.log('Game constructor called');
        this.score = 0;
        this.gameSpeed = 0.1;
        this.isGameOver = false;
        this.obstacles = [];
        this.collectibles = [];
        this.crawlAnimationTime = 0;
        this.tunnelSegments = [];
        this.currentPath = 'land'; // land, water, or space
        this.milkBottlesCollected = 0;
        this.spaceObjects = [];
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = 0.01;
        this.ringSpacing = 1.5; // Added ringSpacing as class property
        
        this.init();
        this.createBaby();
        this.createTunnel();
        this.createSpaceEnvironment();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        console.log('Initializing game...');
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);

        this.scene = new THREE.Scene();
        
        // Set up camera for better view
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 5); // Moved camera back for better view
        this.camera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        this.addStars();
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    createBaby() {
        const textureLoader = new THREE.TextureLoader();
    
        // Load baby texture with sharper filtering
        const babyTexture = textureLoader.load('/baby.png', (texture) => {
            texture.minFilter = THREE.NearestFilter;  // Sharper when zoomed in
            texture.magFilter = THREE.NearestFilter;
        });
    
        const legTexture = textureLoader.load('/baby-leg.png', (texture) => {
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
        });
    
        // Create baby sprite
        const babyMaterial = new THREE.SpriteMaterial({ 
            map: babyTexture,
            transparent: true
        });
    
        this.baby = new THREE.Sprite(babyMaterial);
        this.baby.scale.set(0.8, 0.8, 1); // Slightly increased for better visibility
        this.baby.position.y = 0.1;
    
        // Leg materials
        const legMaterial = new THREE.SpriteMaterial({
            map: legTexture,
            transparent: true
        });
    
        // Left leg
        this.leftLeg = new THREE.Sprite(legMaterial);
        this.leftLeg.scale.set(0.25, 0.25, 1); // Slightly bigger for visibility
        this.leftLeg.position.set(-0.15, 0, 0);
        this.baby.add(this.leftLeg);
    
        // Right leg
        this.rightLeg = new THREE.Sprite(legMaterial);
        this.rightLeg.scale.set(0.25, 0.25, 1);
        this.rightLeg.position.set(0.15, 0, 0);
        this.baby.add(this.rightLeg);
    
        this.scene.add(this.baby);
    }
    
    createSpaceEnvironment() {
        // Add more stars with different sizes and colors
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const starsVertices = [];
        const starsColors = [];
        for (let i = 0; i < 15000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
            
            const color = new THREE.Color();
            color.setHSL(Math.random(), 1, 0.5 + Math.random() * 0.5);
            starsColors.push(color.r, color.g, color.b);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        starsMaterial.vertexColors = true;
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);

        // Add a larger moon with craters
        const moonGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const moonMaterial = new THREE.MeshPhongMaterial({
            color: 0xdddddd,
            emissive: 0x222222,
            shininess: 0,
            bumpScale: 0.05
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(15, 8, -70);
        this.scene.add(moon);

        // Add rockets
        for (let i = 0; i < 3; i++) {
            const rocketGeometry = new THREE.ConeGeometry(0.2, 0.8, 16);
            const rocketMaterial = new THREE.MeshPhongMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
            rocket.position.set(
                Math.random() * 30 - 15,
                Math.random() * 15 - 7.5,
                -50 - Math.random() * 40
            );
            rocket.rotation.x = Math.PI / 2;
            this.scene.add(rocket);
            this.spaceObjects.push(rocket);
        }

        // Add more satellites with different shapes
        const satelliteShapes = [
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16)
        ];

        for (let i = 0; i < 5; i++) {
            const shape = satelliteShapes[Math.floor(Math.random() * satelliteShapes.length)];
            const satelliteMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                emissive: 0x222222,
                shininess: 100
            });
            const satellite = new THREE.Mesh(shape, satelliteMaterial);
            satellite.position.set(
                Math.random() * 30 - 15,
                Math.random() * 15 - 7.5,
                -50 - Math.random() * 40
            );
            satellite.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(satellite);
            this.spaceObjects.push(satellite);
        }
    }

    createTunnel() {
        const ringRadius = 1.5;
        const ringThickness = 0.3;
        const numRings = 200; // Increased number of rings

        for (let i = 0; i < numRings; i++) {
            const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 32, 64);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: this.getPathColor(),
                transparent: true,
                opacity: 0.8,
                emissive: this.getPathColor(),
                emissiveIntensity: 0.8
            });

            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = -i * this.ringSpacing;
            ring.position.x = 0;
            ring.rotation.y = 0;

            this.scene.add(ring);
            this.tunnelSegments.push(ring);
        }
    }

    getPathColor() {
        switch(this.currentPath) {
            case 'land': return 0x00ff00; // Green for land
            case 'water': return 0x0000ff; // Blue for water
            case 'space': return 0x00ffff; // Cyan for space
            default: return 0x00ffff;
        }
    }

    updateTunnel() {
        this.tunnelSegments.forEach((ring, index) => {
            ring.position.z += this.gameSpeed;

            // When a ring goes behind the camera, move it to the front
            if (ring.position.z > 5) {
                // Find the farthest ring
                const farthestRing = this.tunnelSegments.reduce((farthest, current) => {
                    return current.position.z < farthest.position.z ? current : farthest;
                });

                // Move this ring to the front
                ring.position.z = farthestRing.position.z - this.ringSpacing;
                
                // Change path type randomly
                if (Math.random() < 0.1) {
                    this.currentPath = ['land', 'water', 'space'][Math.floor(Math.random() * 3)];
                }
                
                // Update ring color based on current path
                ring.material.color.setHex(this.getPathColor());
                ring.material.emissive.setHex(this.getPathColor());
            }
        });
    }

    setupControls() {
        this.keys = {
            left: false,
            right: false,
            jump: false
        };

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp') this.keys.jump = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === ' ' || e.key === 'ArrowUp') this.keys.jump = false;
        });

        // Touch controls for mobile
        document.addEventListener('touchstart', (e) => {
            const touchX = e.touches[0].clientX;
            const halfWidth = window.innerWidth / 2;
            if (touchX < halfWidth) {
                this.keys.left = true;
                this.keys.right = false;
            } else {
                this.keys.right = true;
                this.keys.left = false;
            }
        });

        document.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
        });
    }

    
    updateCrawlAnimation() {
        this.crawlAnimationTime += 0.1;
        
        // Animate baby position
        this.baby.position.y = 0.1 + Math.sin(this.crawlAnimationTime * 2) * 0.1;
        
        // Animate legs in crawling motion
        const legAngle = Math.sin(this.crawlAnimationTime * 4) * 0.5;
        const legOffset = Math.sin(this.crawlAnimationTime * 4) * 0.1;
        
        // Left leg animation
        this.leftLeg.rotation.z = legAngle;
        this.leftLeg.position.y = legOffset;
        
        // Right leg animation (opposite phase)
        this.rightLeg.rotation.z = -legAngle;
        this.rightLeg.position.y = -legOffset;
        
        // Make baby face the direction it's moving
        if (this.keys.left) {
            this.baby.rotation.y = Math.PI;
        } else if (this.keys.right) {
            this.baby.rotation.y = 0;
        }
    }

    update() {
        if (this.isGameOver) return;

        this.updateCrawlAnimation();
        this.updateTunnel();
        this.updateJump();

        // Move baby based on current path
        if (this.keys.left) {
            this.baby.position.x -= 0.15; // Increased movement speed
        }
        if (this.keys.right) {
            this.baby.position.x += 0.15; // Increased movement speed
        }

        // Keep baby within bounds
        this.baby.position.x = Math.max(-1.2, Math.min(1.2, this.baby.position.x));

        // Update baby animation based on path
        switch(this.currentPath) {
            case 'land':
                if (!this.isJumping) {
                    this.baby.position.y = 0.1 + Math.sin(this.crawlAnimationTime * 2) * 0.1;
                }
                break;
            case 'water':
                this.baby.position.y = 0.1 + Math.sin(this.crawlAnimationTime) * 0.2;
                break;
            case 'space':
                this.baby.position.y = 0.1 + Math.sin(this.crawlAnimationTime * 0.5) * 0.3;
                break;
        }

        // Move obstacles and collectibles
        this.obstacles.forEach((obstacle, index) => {
            obstacle.position.z += this.gameSpeed;
            if (obstacle.position.z > 5) {
                this.scene.remove(obstacle);
                this.obstacles.splice(index, 1);
            }
        });

        this.collectibles.forEach((collectible, index) => {
            collectible.position.z += this.gameSpeed;
            if (collectible.position.z > 5) {
                this.scene.remove(collectible);
                this.collectibles.splice(index, 1);
            }
        });

        this.checkCollisions();

        if (Math.random() < 0.02) this.spawnMilkBottle();
        if (Math.random() < 0.01) this.spawnObstacle();

        this.gameSpeed += 0.00005;
    }

    updateJump() {
        if (this.keys.jump && !this.isJumping && this.currentPath === 'land') {
            this.isJumping = true;
            this.jumpVelocity = 0.2;
        }

        if (this.isJumping) {
            this.baby.position.y += this.jumpVelocity;
            this.jumpVelocity -= this.gravity;

            if (this.baby.position.y <= 0.1) {
                this.baby.position.y = 0.1;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
    }

    spawnMilkBottle() {
        const textureLoader = new THREE.TextureLoader();
        
        // Load milk bottle texture
        const bottleTexture = textureLoader.load('./milk-bottle.png', (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });

        // Create milk bottle sprite
        const bottleMaterial = new THREE.SpriteMaterial({ 
            map: bottleTexture,
            transparent: true
        });
        
        const milkBottle = new THREE.Sprite(bottleMaterial);
        milkBottle.scale.set(0.6, 0.6, 1);
        
        // Randomly choose one of three lanes (-1, 0, 1)
        const lane = Math.floor(Math.random() * 3) - 1;
        milkBottle.position.x = lane * 1.2;
        milkBottle.position.z = -10;
        milkBottle.position.y = 0.25;
        
        this.scene.add(milkBottle);
        this.collectibles.push(milkBottle);
    }

    spawnObstacle() {
        const textureLoader = new THREE.TextureLoader();
        
        //Load obstacle textures
        const boxTexture = textureLoader.load('/box.png');
        const wallTexture = textureLoader.load('/wall.png');
        const jumpTexture = textureLoader.load('/jump.png');

        const obstacleTypes = [
            { type: 'box', texture: boxTexture, scale: 0.5 },
            { type: 'wall', texture: wallTexture, scale: 0.5 },
            { type: 'jump', texture: jumpTexture, scale: 0.5 }
        ];

        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const material = new THREE.SpriteMaterial({ 
            map: obstacleType.texture,
            transparent: true
        });
        
        const obstacle = new THREE.Sprite(material);
        obstacle.scale.set(obstacleType.scale, obstacleType.scale, 1);
        
        // Randomly choose one of three lanes (-1, 0, 1)
        const lane = Math.floor(Math.random() * 3) - 1;
        obstacle.position.set(lane * 1.2, 0.25, -10);
        obstacle.userData.type = obstacleType.type;
        
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
    }

    checkCollisions() {
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.baby, obstacle)) {
                if (obstacle.userData.type === 'jump' && this.isJumping) {
                    // Jump over the obstacle
                    this.scene.remove(obstacle);
                    this.obstacles = this.obstacles.filter(o => o !== obstacle);
                } else {
                    this.gameOver();
                }
            }
        });

        // Check milk bottle collisions
        this.collectibles.forEach((collectible, index) => {
            if (this.checkCollision(this.baby, collectible)) {
                this.scene.remove(collectible);
                this.collectibles.splice(index, 1);
                this.milkBottlesCollected++;
                document.getElementById('score').textContent = `Milk Bottles: ${this.milkBottlesCollected}`;
                document.getElementById('final-score').textContent = `Milk Bottles Collected: ${this.milkBottlesCollected}`;
            }
        });
    }

    checkCollision(object1, object2) {
        const distance = object1.position.distanceTo(object2.position);
        return distance < 0.5;
    }

    gameOver() {
        this.isGameOver = true;
        // Update final score display
        document.getElementById('final-score').textContent = `Milk Bottles Collected: ${this.milkBottlesCollected}`;
        document.getElementById('game-over').classList.remove('hidden');
    }

    restartGame() {
        // Reset game state
        this.milkBottlesCollected = 0;
        this.gameSpeed = 0.1;
        this.isGameOver = false;
        this.currentPath = 'land';
        
        // Update UI
        document.getElementById('score').textContent = 'Milk Bottles: 0';
        document.getElementById('final-score').textContent = 'Milk Bottles Collected: 0';
        document.getElementById('game-over').classList.add('hidden');

        // Clear all objects
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.collectibles.forEach(collectible => this.scene.remove(collectible));
        this.tunnelSegments.forEach(segment => this.scene.remove(segment));
        this.spaceObjects.forEach(obj => this.scene.remove(obj));
        
        this.obstacles = [];
        this.collectibles = [];
        this.tunnelSegments = [];
        this.spaceObjects = [];

        // Reset baby position
        this.baby.position.x = 0;
        this.baby.position.y = 0.1;

        // Recreate environment
        this.createTunnel();
        this.createSpaceEnvironment();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
   
 
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Add retry button event listener
        document.getElementById('retry-button').addEventListener('click', () => {
            this.restartGame();
        });

        // Add keyboard controls explanation
        const showControls = () => {
            document.getElementById('controls-info').style.opacity = '0.8';
        };
        
        const hideControls = () => {
            document.getElementById('controls-info').style.opacity = '0';
        };

        // Show controls when game starts
        showControls();
        
        // Hide controls after 5 seconds
        setTimeout(hideControls, 5000);

        // Show controls when key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                showControls();
                setTimeout(hideControls, 2000);
            }
        });
    }
}

// Start the game
new Game(); 

