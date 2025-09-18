import { motion, useIsomorphicLayoutEffect } from 'motion/react'
import { nanoid } from 'nanoid'
import { useEffect, useMemo, useRef } from 'react'

import { Animator, animations } from '@/lib/animate'

export type LogoProps = {
  className?: string
  /**
   * Globally unique animator label. Randomly generated if not provided.
   */
  animatorLabel?: string
  followMouse?: boolean
  blinkOnClick?: boolean
  blinkInterval?: boolean
}

const Logo = ({
  className,
  animatorLabel = nanoid(),
  followMouse = false,
  blinkOnClick = false,
  blinkInterval = true,
}: LogoProps) => {
  const animator = useMemo(() => {
    const animator = Animator.instance(animatorLabel)

    // Targets.
    animator.registerTarget('logo')
    animator.registerTarget('iris')
    animator.registerTarget('structure')
    animator.registerTarget('verticalTop')
    animator.registerTarget('topRight')
    animator.registerTarget('horizontalRight')
    animator.registerTarget('bottomRight')
    animator.registerTarget('verticalBottom')
    animator.registerTarget('bottomLeft')
    animator.registerTarget('horizontalLeft')
    animator.registerTarget('topLeft')

    // Animations.
    animator.registerAnimation('logo', 'glow', animations.glow)
    animator.registerAnimation('iris', 'blink', animations.blink)
    animator.registerAnimation('iris', 'squint', animations.squint)
    animator.registerAnimation('iris', 'expand', animations.expand)
    animator.registerAnimation('iris', 'pulse', animations.pulse)
    animator.registerAnimation('structure', 'expand', animations.expand)
    animator.registerAnimation('structure', 'pulse', animations.pulse)
    animator.registerAnimation('topLeft', 'wave', animations.wave('topLeft'))
    animator.registerAnimation(
      'topLeft',
      'prod',
      animations.diagonalProd('topLeft')
    )
    animator.registerAnimation(
      'topLeft',
      'wag',
      animations.diagonalWag('topLeft')
    )
    animator.registerAnimation('topRight', 'wave', animations.wave('topRight'))
    animator.registerAnimation(
      'topRight',
      'prod',
      animations.diagonalProd('topRight')
    )
    animator.registerAnimation(
      'topRight',
      'wag',
      animations.diagonalWag('topRight')
    )
    animator.registerAnimation(
      'bottomRight',
      'prod',
      animations.diagonalProd('bottomRight')
    )
    animator.registerAnimation(
      'bottomRight',
      'wag',
      animations.diagonalWag('bottomRight')
    )
    animator.registerAnimation(
      'bottomLeft',
      'prod',
      animations.diagonalProd('bottomLeft')
    )
    animator.registerAnimation(
      'bottomLeft',
      'wag',
      animations.diagonalWag('bottomLeft')
    )
    animator.registerAnimation('top', 'stretch', animations.stretch('top'))
    animator.registerAnimation(
      'bottom',
      'stretch',
      animations.stretch('bottom')
    )
    animator.registerAnimation('left', 'stretch', animations.stretch('left'))
    animator.registerAnimation('right', 'stretch', animations.stretch('right'))

    // Animation tasks.
    animator.registerTask('thinking', ({ start }) =>
      Promise.all([
        start('structure', 'pulse', { duration: 3, repeat: 1 }),
        start('logo', 'glow', { duration: 3, repeat: 1 }),
      ])
    )
    animator.registerTask('wave', ({ start }) =>
      Promise.all([start('topRight', 'wave'), start('topLeft', 'wave')])
    )
    animator.registerTask('wag', ({ start }) =>
      Promise.all([
        start('topRight', 'wag'),
        start('topLeft', 'wag'),
        start('bottomRight', 'wag'),
        start('bottomLeft', 'wag'),
      ])
    )
    animator.registerTask('blink', ({ start }) => start('iris', 'blink'))

    return animator
  }, [animatorLabel])

  // Mount the animator targets when the component mounts, and unmount.
  useIsomorphicLayoutEffect(() => animator?.mount(), [animator])

  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!followMouse) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) {
        return
      }

      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate mouse position relative to center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Convert to rotation values with proper bounds
      const maxTilt = 30 // Maximum tilt in degrees
      const maxDistance = window.innerWidth / 2 // Half window width for max tilt

      const rotateY = Math.max(
        -maxTilt,
        Math.min(maxTilt, (deltaX / maxDistance) * maxTilt)
      )
      const rotateX = Math.max(
        -maxTilt,
        Math.min(maxTilt, -(deltaY / maxDistance) * maxTilt)
      )

      animator?.target('logo').set({
        rotateX: rotateX + 'deg',
        rotateY: rotateY + 'deg',
        perspective: 300,
        transformStyle: 'preserve-3d',
        transformBox: 'view-box',
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [followMouse, animator])

  // Trigger eye blink animation every 20-40 seconds
  useEffect(() => {
    if (!blinkInterval) {
      return
    }

    let timeout: NodeJS.Timeout
    const queueBlink = () => {
      timeout = setTimeout(() => {
        animator?.runTask('blink')
        queueBlink()
      }, Math.random() * 20_000 + 20_000)
    }
    queueBlink()

    return () => clearTimeout(timeout)
  }, [blinkInterval])

  // Trigger eye blink animation on click 3% of the time.
  useEffect(() => {
    if (!blinkOnClick) {
      return
    }

    const handleClick = () => {
      const value = Math.random()
      if (value < 0.03) {
        animator?.runTask('blink')
      }
    }
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [blinkOnClick])

  return (
    <motion.svg
      animate={animator?.target('logo')}
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width={647}
      height={917}
      viewBox="0 0 647 917"
      fill="none"
      onClick={async () => {
        await animator?.runTask('wave')
        await new Promise((resolve) => setTimeout(resolve, 350))
        await animator?.runTask('blink')
        await new Promise((resolve) => setTimeout(resolve, 350))
        await animator?.runTask('wag')
        await new Promise((resolve) => setTimeout(resolve, 350))
        await animator?.runTask('blink')
        await new Promise((resolve) => setTimeout(resolve, 350))
        await animator?.runTask('thinking')
      }}
      className={className}
    >
      <motion.path
        animate={animator?.target('structure')}
        d="M368.192 533.068C370.368 532.371 372.685 533.636 373.276 535.843L382.388 569.85C383.261 573.109 382.122 576.576 379.486 578.681V578.681C374.702 582.502 367.57 580.158 365.986 574.245L356.986 540.656C356.434 538.595 357.597 536.463 359.63 535.812L368.192 533.068ZM265.74 535.843C266.332 533.636 268.648 532.372 270.824 533.069L279.386 535.812C281.418 536.463 282.582 538.595 282.029 540.656L274.613 568.334C273.029 574.247 265.897 576.591 261.113 572.77V572.77C258.477 570.664 257.338 567.198 258.211 563.939L265.74 535.843ZM198.569 489.968C200.185 488.352 202.823 488.416 204.359 490.107L210.403 496.764C211.838 498.344 211.779 500.771 210.271 502.28L199.027 513.523C195.97 516.58 191.104 516.851 187.726 514.153V514.153C183.769 510.994 183.441 505.096 187.021 501.516L198.569 489.968ZM447.656 488.107C449.192 486.416 451.831 486.352 453.446 487.968L464.323 498.845C467.903 502.425 467.574 508.322 463.619 511.482V511.482C460.24 514.18 455.374 513.909 452.317 510.851L441.746 500.28C440.237 498.771 440.179 496.344 441.613 494.764L447.656 488.107ZM221.158 417.603C223.006 418.67 223.691 421 222.714 422.897L218.6 430.891C217.554 432.922 215.022 433.666 213.043 432.523L178.836 412.773C173.657 409.784 173.11 402.52 177.782 398.788V398.788C180.512 396.608 184.3 396.322 187.325 398.069L221.158 417.603ZM469.916 398.548C474.589 402.28 474.042 409.545 468.863 412.535L439.942 429.232C438.094 430.299 435.734 429.727 434.579 427.933L429.714 420.372C428.477 418.451 429.098 415.886 431.077 414.743L460.372 397.829C463.399 396.082 467.186 396.367 469.916 398.548V398.548ZM287.737 377.426C288.623 379.367 287.829 381.662 285.933 382.641L277.942 386.764C275.912 387.811 273.418 386.949 272.47 384.87L254.577 345.672C252.96 342.13 253.96 337.943 257.002 335.513V335.513C261.32 332.064 267.729 333.594 270.024 338.621L287.737 377.426ZM395.318 338.964C398.599 341.584 399.472 346.208 397.373 349.844L377.021 385.096C375.953 386.944 373.623 387.629 371.726 386.652L363.731 382.537C361.7 381.491 360.956 378.959 362.099 376.98L382.667 341.354C385.265 336.854 391.258 335.722 395.318 338.964V338.964Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('iris')}
        d="M324.261 487.52C305.219 487.52 289.782 472.688 289.782 454.393C289.782 436.098 305.219 421.267 324.261 421.267C343.303 421.267 358.739 436.098 358.739 454.393C358.739 472.688 343.303 487.52 324.261 487.52Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('topLeft')}
        d="M249.321 389.985C252.39 393.537 251.998 398.905 248.446 401.974V401.974C244.894 405.043 239.526 404.651 236.457 401.099L179.912 335.647C176.843 332.094 177.235 326.727 180.787 323.658V323.658C184.339 320.589 189.707 320.981 192.776 324.533L249.321 389.985Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('horizontalLeft')}
        d="M231.313 447C236.007 447 239.813 450.806 239.813 455.5V455.5C239.813 460.194 236.007 464 231.313 464H109.313C104.618 464 100.813 460.194 100.813 455.5V455.5C100.813 450.806 104.618 447 109.313 447H231.313Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('horizontalRight')}
        d="M548.5 447C553.194 447 557 450.806 557 455.5V455.5C557 460.194 553.194 464 548.5 464H408.5C403.806 464 400 460.194 400 455.5V455.5C400 450.806 403.806 447 408.5 447H548.5Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('verticalTop')}
        d="M315 290.5C315 285.806 318.806 282 323.5 282V282C328.194 282 332 285.806 332 290.5L332 392.5C332 397.194 328.194 401 323.5 401V401C318.806 401 315 397.194 315 392.5L315 290.5Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('verticalBottom')}
        d="M315 527.5C315 522.806 318.806 519 323.5 519V519C328.194 519 332 522.806 332 527.5L332 622.5C332 627.194 328.194 631 323.5 631V631C318.806 631 315 627.194 315 622.5L315 527.5Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('bottomRight')}
        d="M406.069 526.659C403 523.107 403.392 517.739 406.945 514.67V514.67C410.497 511.601 415.864 511.993 418.933 515.546L475.496 581.017C478.565 584.569 478.173 589.937 474.62 593.006V593.006C471.068 596.075 465.7 595.683 462.631 592.13L406.069 526.659Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('topRight')}
        d="M404.398 391.597C401.329 395.15 401.721 400.517 405.274 403.586V403.586C408.826 406.655 414.194 406.263 417.263 402.711L473.367 337.769C476.436 334.217 476.044 328.849 472.492 325.78V325.78C468.94 322.712 463.572 323.103 460.503 326.656L404.398 391.597Z"
        fill="white"
      />
      <motion.path
        animate={animator?.target('bottomLeft')}
        d="M244.496 529.683C247.565 526.131 247.173 520.763 243.62 517.694V517.694C240.068 514.625 234.7 515.017 231.631 518.57L173.323 586.063C170.254 589.615 170.645 594.983 174.198 598.052V598.052C177.75 601.121 183.118 600.729 186.187 597.176L244.496 529.683Z"
        fill="white"
      />
    </motion.svg>
  )
}

export default Logo
