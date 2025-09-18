import {
  AnimationDefinition,
  LegacyAnimationControls,
  animationControls,
} from 'motion/react'

export type AnimateOptions = {
  duration?: number
  repeat?: number
  scale?: number
}

export type AnimationFunction = (
  options?: AnimateOptions
) => AnimationDefinition

export const wave =
  (side: 'topLeft' | 'topRight') =>
  ({
    duration = 1 + Math.random() * 0.2 * (Math.random() < 0.5 ? 1 : -1),
    repeat = 0,
  }: AnimateOptions = {}) => {
    const peak = 1.2 + Math.random() * 0.3

    return {
      rotate: [
        0,
        -15 + Math.random() * 5 * (Math.random() < 0.5 ? 1 : -1),
        15 + Math.random() * 5 * (Math.random() < 0.5 ? 1 : -1),
        -15 + Math.random() * 5 * (Math.random() < 0.5 ? 1 : -1),
        15 + Math.random() * 5 * (Math.random() < 0.5 ? 1 : -1),
        0,
      ],
      scale: [
        1,
        (1 + peak) / 2 + ((peak - 1) / 2) * Math.random(),
        peak,
        peak,
        (1 + peak) / 2 + ((peak - 1) / 2) * Math.random(),
        1,
      ],
      transformOrigin: side === 'topLeft' ? 'bottom right' : 'bottom left',
      transition: {
        duration,
        repeat,
        ease: 'easeInOut',
      },
    } satisfies AnimationDefinition
  }

export const blink = ({ duration = 0.25, repeat = 0 }: AnimateOptions = {}) => {
  return {
    scaleY: [1, 0.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration,
      repeat,
      ease: 'easeInOut',
    },
  } satisfies AnimationDefinition
}

export const squint = ({ duration = 1, repeat = 0 }: AnimateOptions = {}) => {
  return {
    scaleY: [1, 0.8, 0.8, 1],
    transition: {
      duration,
      repeat,
      times: [0, 0.2, 0.8, 1],
      ease: 'easeInOut',
    },
  } satisfies AnimationDefinition
}

export const pulse = ({
  duration = 3,
  repeat = Infinity,
}: AnimateOptions = {}) => {
  return {
    scale: [1, 1.15, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration,
      repeat,
      ease: 'easeInOut',
    },
  } satisfies AnimationDefinition
}

export const expand = ({
  scale = 1.1,
  duration = 1,
  repeat = 0,
}: AnimateOptions = {}) => {
  return {
    scale: [1, scale, scale, 1],
    transition: {
      duration,
      repeat,
      times: [0, 0.2, 0.8, 1],
      ease: 'easeInOut',
    },
  } satisfies AnimationDefinition
}

export const stretch =
  (side: 'top' | 'bottom' | 'left' | 'right') =>
  ({ duration = 1, repeat = 0 }: AnimateOptions = {}) => {
    return {
      scaleY:
        side === 'top' || side === 'bottom' ? [1, 1.2, 1.2, 1] : undefined,
      scaleX:
        side === 'left' || side === 'right' ? [1, 1.2, 1.2, 1] : undefined,
      transformOrigin:
        side === 'top'
          ? 'bottom'
          : side === 'bottom'
          ? 'top'
          : side === 'left'
          ? 'right'
          : 'left',
      transition: {
        duration,
        repeat,
        times: [0, 0.2, 0.8, 1],
        ease: 'easeInOut',
      },
    } satisfies AnimationDefinition
  }

export const glow = ({ duration = 3, repeat = 3 }: AnimateOptions = {}) => {
  return {
    filter: [
      'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
      'drop-shadow(0 0 20px rgba(255, 255, 255, 0.4))',
      'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
    ],
    transition: {
      duration,
      repeat,
      ease: 'easeInOut',
    },
  } satisfies AnimationDefinition
}

export const diagonalProd =
  (side: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') =>
  ({ duration = 3, repeat = 5 }: AnimateOptions = {}) => {
    return {
      rotate: [0, '2deg', '-1deg', 0],
      scale: [1, 1.3, 1.1, 1],
      transformOrigin:
        side === 'topLeft'
          ? 'bottom right'
          : side === 'topRight'
          ? 'bottom left'
          : side === 'bottomRight'
          ? 'top left'
          : 'top right',
      transition: {
        duration,
        repeat,
        times: [0, 0.3, 0.7, 1],
        ease: 'easeInOut',
      },
    } satisfies AnimationDefinition
  }

export const animations = {
  glow,
  blink,
  squint,
  expand,
  pulse,
  wave,
  diagonalProd,
  stretch,
}

export type AnimatorTaskFunction = (animator: Animator) => void | Promise<void>

export class Animator {
  static _instance: Animator | null = null
  static get instance() {
    if (!Animator._instance) {
      Animator._instance = new Animator()
    }
    return Animator._instance
  }

  /**
   * Targets that can be animated.
   */
  private targets: Record<string, LegacyAnimationControls> = {}

  /**
   * Whether or not a target has been mounted.
   */
  private targetMounted: Record<string, boolean> = {}

  /**
   * Animations that can be applied to targets.
   */
  private animations: Record<
    string,
    (options?: AnimateOptions) => AnimationDefinition
  > = {}

  /**
   * Tasks that group animations together.
   */
  private tasks: Record<string, AnimatorTaskFunction> = {}

  /**
   * Register a target that can be animated.
   */
  registerTarget(
    target: string,
    controls?: LegacyAnimationControls
  ): LegacyAnimationControls {
    this.targets[target] = controls ?? animationControls()
    this.targetMounted[target] = false
    return this.targets[target]
  }

  /**
   * Get a target by name.
   */
  target(name: string) {
    if (!this.targets[name]) {
      throw new Error(`Target ${name} not found`)
    }
    return this.targets[name]
  }

  /**
   * Mount all targets, and return a function to unmount all targets.
   */
  mount() {
    const unmounts = Object.entries(this.targets).map(([target, controls]) => {
      this.targetMounted[target] = true
      return controls.mount()
    })
    return () => unmounts.forEach((unmount) => unmount())
  }

  /**
   * Register an animation, optionally for a target. When running animations, it will attempt to use the animation registered for the target, falling back to the animation registered for the name and no specific target.
   */
  registerAnimation(
    target: string,
    name: string,
    animation: AnimationFunction
  ): void
  registerAnimation(name: string, animation: AnimationFunction): void
  registerAnimation(
    targetOrName: string,
    nameOrAnimation: string | AnimationFunction,
    animation?: AnimationFunction
  ): void {
    if (
      typeof targetOrName === 'string' &&
      typeof nameOrAnimation === 'string' &&
      animation
    ) {
      this.animations[`${targetOrName}:${nameOrAnimation}`] = animation
    } else if (
      typeof targetOrName === 'string' &&
      typeof nameOrAnimation === 'function' &&
      !animation
    ) {
      this.animations[targetOrName] = nameOrAnimation
    } else {
      throw new Error('Invalid animation registration')
    }
  }

  /**
   * Register a task that groups animations together.
   */
  registerTask(name: string, task: AnimatorTaskFunction) {
    this.tasks[name] = task
  }

  /**
   * Run a task.
   */
  runTask(name: string): void | Promise<void> {
    const task = this.tasks[name]
    if (!task) {
      throw new Error(`Task ${name} not found`)
    }
    return task(this)
  }

  /**
   * Start an animation on a target.
   */
  start = (target: string, animation: string, options?: AnimateOptions) => {
    // Use target-specific animation if available, otherwise use global animation.
    const animationFn =
      this.animations[`${target}:${animation}`] || this.animations[animation]
    if (!animationFn) {
      throw new Error(`Animation ${animation} not found`)
    }

    const targetControls = this.target(target)
    if (!this.targetMounted[target]) {
      throw new Error(`Target ${target} not mounted`)
    }

    return targetControls.start(animationFn(options))
  }
}
