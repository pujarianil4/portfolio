import { useRef, useEffect } from 'react';
import classNames from 'classnames';
import {
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  UnsignedByteType,
  PMREMGenerator,
  AmbientLight,
  DirectionalLight,
  Color,
} from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { spring, value } from 'popmotion';
import { usePrefersReducedMotion, useInViewport } from 'hooks';
import { cleanScene, cleanRenderer, removeLights } from 'utils/three';
import { rgbToThreeColor } from 'utils/style';
import { useTheme } from 'components/ThemeProvider';
import portraitEnv from 'assets/portrait-env.hdr';
import portraitModelPath from 'assets/portrait.glb';
import './Portrait.css';

const Portrait = ({ className, delay, ...rest }) => {
  const { colorWhite, themeId, rgbBackgroundLight } = useTheme();
  const container = useRef();
  const canvas = useRef();
  const renderer = useRef();
  const camera = useRef();
  const scene = useRef();
  const lights = useRef();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isInViewport = useInViewport(canvas);

  // Init scene and models
  useEffect(() => {
    const { clientWidth, clientHeight } = container.current;

    renderer.current = new WebGLRenderer({
      canvas: canvas.current,
      powerPreference: 'high-performance',
    });

    renderer.current.setPixelRatio(2);
    renderer.current.setSize(clientWidth, clientHeight);
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.physicallyCorrectLights = true;

    camera.current = new PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 800);
    camera.current.position.z = 2;

    scene.current = new Scene();

    const envLoader = new RGBELoader();
    envLoader.setDataType(UnsignedByteType);

    envLoader.load(portraitEnv, texture => {
      const pmremGenerator = new PMREMGenerator(renderer.current);
      pmremGenerator.compileEquirectangularShader();

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();

      scene.current.environment = envMap;
    });

    const modelLoader = new GLTFLoader();

    modelLoader.load(portraitModelPath, model => {
      model.scene.traverse(node => {
        if (node.isMesh) {
          node.material.flatShading = false;
          node.geometry.computeVertexNormals(true);
        }
      });

      model.scene.scale.multiplyScalar(3);

      scene.current.add(model.scene);
      model.scene.position.y = -5;
    });

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, []);

  // Lights
  useEffect(() => {
    const ambientLight = new AmbientLight(colorWhite, 0.8);
    const dirLight = new DirectionalLight(colorWhite, themeId === 'light' ? 1.6 : 0.8);

    dirLight.position.set(30, 20, 32);

    lights.current = [ambientLight, dirLight];
    scene.current.background = new Color(...rgbToThreeColor(rgbBackgroundLight));
    lights.current.forEach(light => scene.current.add(light));

    return () => {
      removeLights(lights.current);
    };
  }, [colorWhite, themeId, rgbBackgroundLight]);

  // Handles window resize
  useEffect(() => {
    const handleResize = () => {
      const { clientWidth, clientHeight } = container.current;

      renderer.current.setSize(clientWidth, clientHeight);
      camera.current.aspect = clientWidth / clientHeight;
      camera.current.updateProjectionMatrix();

      if (prefersReducedMotion) {
        renderer.current.render(scene.current, camera.current);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [prefersReducedMotion]);

  // Handle mouse move animation
  useEffect(() => {
    let rotationSpring;
    let rotationSpringValue;

    const onMouseMove = event => {
      const { rotation } = scene.current;
      const { innerWidth, innerHeight } = window;

      const position = {
        x: (event.clientX - innerWidth / 2) / innerWidth,
        y: (event.clientY - innerHeight / 2) / innerHeight,
      };

      if (!rotationSpringValue) {
        rotationSpringValue = value({ x: rotation.x, y: rotation.y }, ({ x, y }) => {
          rotation.set(x, y, rotation.z);
        });
      }

      rotationSpring = spring({
        from: rotationSpringValue.get(),
        to: { x: position.y / 2, y: position.x / 2 },
        stiffness: 40,
        damping: 40,
        velocity: rotationSpringValue.getVelocity(),
        restSpeed: 0.00001,
        mass: 1.4,
      }).start(rotationSpringValue);
    };

    if (isInViewport && !prefersReducedMotion) {
      window.addEventListener('mousemove', onMouseMove);
    }

    return function cleanup() {
      window.removeEventListener('mousemove', onMouseMove);

      rotationSpring?.stop();
    };
  }, [isInViewport, prefersReducedMotion]);

  // Handles renders
  useEffect(() => {
    let animation;

    const animate = () => {
      animation = requestAnimationFrame(animate);

      renderer.current.render(scene.current, camera.current);
    };

    if (!prefersReducedMotion && isInViewport) {
      animate();
    } else {
      renderer.current.render(scene.current, camera.current);
    }

    return () => {
      cancelAnimationFrame(animation);
    };
  }, [isInViewport, prefersReducedMotion]);

  return (
    <div
      className={classNames('portrait', className)}
      ref={container}
      style={{ '--delay': delay }}
      role="img"
      aria-label="A 3D portrait of myself."
      {...rest}
    >
      <canvas aria-hidden className="portrait__canvas" ref={canvas} />
    </div>
  );
};

export default Portrait;
