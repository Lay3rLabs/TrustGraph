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
      width={9559}
      height={8486}
      viewBox="0 0 9559 8486"
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
        animate={animator?.target('iris')}
        d="M4758.5 3434.54C5200.33 3434.54 5558.5 3792.71 5558.5 4234.54C5558.5 4676.37 5200.33 5034.54 4758.5 5034.54C4316.67 5034.54 3958.5 4676.37 3958.5 4234.54C3958.5 3792.71 4316.67 3434.54 4758.5 3434.54Z"
        fill="#F0F0F0"
      />
      <motion.g animate={animator?.target('structure')}>
        <motion.path
          d="M3703.37 5963.06C3740.92 5886.1 3832.24 5852.85 3912.46 5882.8C3929.91 5889.32 3947.43 5895.66 3965.02 5901.82C4059.96 5935.08 4109.36 6043.16 4065.25 6133.57L3715.66 6850.1C3677.73 6927.83 3584.72 6961.67 3507.56 6922.59C3478.68 6907.96 3449.95 6892.92 3421.37 6877.49C3347.94 6837.83 3320.92 6746.94 3357.51 6671.94L3703.37 5963.06Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M6168.93 6628.52C6205.41 6702.43 6179.96 6792.29 6108.39 6833.17C6080.38 6849.17 6052.2 6864.81 6023.87 6880.05C5946.54 6921.68 5851.28 6888.7 5812.41 6809.95L5464.37 6104.86C5420.67 6016.33 5466.92 5909.93 5559.12 5874.65C5576.85 5867.86 5594.51 5860.9 5612.09 5853.77C5692.73 5821.06 5786.38 5853.53 5824.9 5931.56L6168.93 6628.52Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M2298.43 4858.92C2356.88 4839 2421.43 4854.62 2465.25 4898.12C2482.5 4915.24 2500.08 4932.49 2518 4949.84C2606.4 5035.44 2575.94 5186.94 2459.46 5226.63L1873.31 5426.37C1811.06 5447.59 1742.06 5428.63 1700.15 5377.95C1680.11 5353.72 1660.39 5329.62 1640.99 5305.68C1571.94 5220.45 1610.16 5093.47 1713.99 5058.08L2298.43 4858.92Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M7748.29 5043.19C7851.86 5078.64 7890.02 5205.29 7821.28 5290.49C7801.98 5314.42 7782.35 5338.52 7762.39 5362.76C7720.45 5413.69 7651.21 5432.74 7588.8 5411.38L7005.48 5211.71C6889.42 5171.98 6858.89 5021.18 6946.72 4935.54C6964.58 4918.12 6982.11 4900.81 6999.29 4883.64C7043.16 4839.79 7108.02 4824.02 7166.7 4844.11L7748.29 5043.19Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M7609.8 3088.92C7672.38 3067.6 7741.73 3086.87 7783.57 3138.06C7803.42 3162.34 7822.94 3186.48 7842.12 3210.44C7910.47 3295.78 7872.08 3422.13 7768.58 3457.4L7189.98 3654.58C7131.05 3674.66 7065.97 3658.6 7022.17 3614.36C7005.08 3597.09 6987.64 3579.67 6969.85 3562.13C6882.73 3476.26 6913.69 3326.14 7029.48 3286.68L7609.8 3088.92Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M2463.91 3244.34C2580.31 3284.19 2610.59 3435.68 2522.12 3521.18C2504.19 3538.5 2486.6 3555.72 2469.34 3572.82C2425.46 3616.3 2360.86 3631.85 2302.42 3611.85L1717.9 3411.77C1614.16 3376.26 1576.1 3249.3 1645.18 3164.15C1664.59 3140.23 1684.33 3116.15 1704.38 3091.94C1746.35 3041.26 1815.41 3022.36 1877.67 3043.67L2463.91 3244.34Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M5801.3 1659.85C5839.81 1580.87 5934.99 1547.48 6012.51 1588.85C6040.92 1604.02 6069.19 1619.58 6097.29 1635.51C6168.91 1676.11 6194.67 1765.77 6158.59 1839.77C6044.93 2072.89 5931.5 2306.12 5818.24 2539.47C5780.11 2618.03 5686.22 2651.07 5605.21 2618.45C5587.63 2611.38 5569.98 2604.47 5552.25 2597.74C5460.23 2562.8 5413.64 2457.02 5456.62 2368.47C5571.3 2132.17 5686.18 1895.95 5801.3 1659.85Z"
          fill="#F0F0F0"
        />
        <motion.path
          d="M4054.28 2344.5C4098.82 2434.73 4049.88 2543.06 3955.05 2576.7C3937.44 2582.94 3919.9 2589.37 3902.44 2595.96C3822.39 2626.19 3731.03 2593.34 3693.16 2516.62L3344.77 1810.81C3307.81 1735.94 3334.47 1644.87 3407.78 1604.89C3436.25 1589.36 3464.87 1574.22 3493.65 1559.49C3570.65 1520.08 3663.82 1553.48 3702.11 1631.04L4054.28 2344.5Z"
          fill="#F0F0F0"
        />
      </motion.g>

      <motion.path
        animate={animator?.target('verticalBottom')}
        d="M4958.5 8326C4958.5 8414.37 4886.86 8486 4798.5 8486H4718.5C4630.13 8486 4558.5 8414.37 4558.5 8326L4558.5 5791C4558.5 5702.64 4630.13 5631 4718.5 5631H4798.5C4886.86 5631 4958.5 5702.64 4958.5 5791L4958.5 8326Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('bottomLeft')}
        d="M2892.91 5451.42C2949.92 5398.05 3036.94 5393.91 3100.42 5439.4C3118.11 5452.08 3135.95 5464.67 3153.94 5477.15C3240.4 5537.17 3252.76 5662.48 3175.92 5734.4L2048.85 6789.34C1984.25 6849.8 1882.73 6846.44 1823.57 6780.64C1804.16 6759.06 1784.89 6737.41 1765.74 6715.7C1709.15 6651.56 1714.7 6554.22 1777.15 6495.77L2892.91 5451.42Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('bottomRight')}
        d="M7695.26 6465.65C7759.52 6523.52 7766.28 6622.08 7709.34 6687.17C7690.31 6708.92 7671.14 6730.61 7651.85 6752.25C7593.57 6817.62 7493.37 6822.13 7428.29 6763.53L6282.96 5732.13C6203.85 5660.89 6215.08 5533.59 6302.43 5472.72C6320.44 5460.17 6338.3 5447.52 6356.01 5434.78C6418.52 5389.82 6504.14 5393.02 6561.36 5444.55L7695.26 6465.65Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('horizontalLeft')}
        d="M3152.5 4290.04C3152.5 4378.41 3080.87 4450.04 2992.5 4450.04H160C71.6344 4450.04 0 4378.41 0 4290.04V4210.04C0 4121.68 71.6344 4050.04 160 4050.04H2992.5C3080.87 4050.04 3152.5 4121.68 3152.5 4210.04V4290.04Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('horizontalRight')}
        d="M9559 4290.04C9559 4378.41 9487.37 4450.04 9399 4450.04H6532.5C6444.13 4450.04 6372.5 4378.41 6372.5 4290.04V4210.04C6372.5 4121.68 6444.13 4050.04 6532.5 4050.04H9399C9487.37 4050.04 9559 4121.68 9559 4210.04V4290.04Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('topRight')}
        d="M7444.12 1722.05C7508.9 1665.74 7606.64 1671.82 7663.63 1735.99C7682.85 1757.62 7701.93 1779.32 7720.88 1801.06C7778.9 1867.62 7770.24 1968.51 7703.62 2026.46C7512.71 2192.54 7314.89 2374.53 7114.47 2559.27C6936.35 2723.45 6756.11 2889.87 6579.13 3046.59C6522.05 3097.13 6437.35 3099.31 6375.69 3054.45C6358.4 3041.87 6340.96 3029.37 6323.38 3016.97C6235.26 2954.79 6225.8 2825.1 6306.58 2753.66C6480.98 2599.41 6660.96 2433.3 6843.36 2265.16C7043.2 2080.95 7245.95 1894.33 7444.12 1722.05Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('topLeft')}
        d="M3182.45 2738.2C3258.07 2810.5 3245.08 2934.78 3159.05 2994.31C3141.07 3006.75 3123.23 3019.3 3105.54 3031.94C3041.53 3077.66 2953.78 3072.97 2896.92 3018.61L1790.84 1961.22C1729.37 1902.46 1724.49 1805.77 1780.91 1742.14C1800.13 1720.46 1819.48 1698.84 1838.95 1677.29C1898.6 1611.28 2000.82 1608.58 2065.13 1670.06L3182.45 2738.2Z"
        fill="#F0F0F0"
      />
      <motion.path
        animate={animator?.target('verticalTop')}
        d="M4958.5 2676.48C4958.5 2764.85 4886.86 2836.48 4798.5 2836.48L4718.5 2836.48C4630.13 2836.48 4558.5 2764.85 4558.5 2676.48V160.004C4558.5 71.6383 4630.13 0.00390625 4718.5 0.00390625H4798.5C4886.86 0.00390625 4958.5 71.6384 4958.5 160.004V2676.48Z"
        fill="#F0F0F0"
      />
    </motion.svg>
  )
}

export default Logo
