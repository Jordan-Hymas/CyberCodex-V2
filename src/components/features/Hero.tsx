"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hero3D } from "./Hero3D";
import { Button } from "@/components/ui";

function Hero3DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-cyber-primary">Loading 3D Scene...</div>
    </div>
  );
}

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cyber-dark">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-dark via-cyber-dark-secondary to-cyber-dark" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(var(--color-cyber-border) 1px, transparent 1px),
                             linear-gradient(90deg, var(--color-cyber-border) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 3D Scene Container */}
      <div className="absolute inset-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[800px] h-[600px] top-1/2 -translate-y-1/2">
        <Suspense fallback={<Hero3DFallback />}>
          <Hero3D />
        </Suspense>
      </div>

      {/* Content */}
      <motion.div
        className="container-custom relative z-10 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-block px-4 py-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded-full text-cyber-primary text-sm font-medium mb-6">
              🎓 Learn. Practice. Master.
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-display-1 mb-6 flex flex-col items-center justify-center gap-2"
          >
            <span className="block text-center">
              Master{" "}
              <span className="gradient-text inline-block">Cybersecurity</span>
            </span>
            <span className="block text-center">Through Action</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-cyber-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Learn ethical hacking, penetration testing, and security best practices through
            interactive tutorials and hands-on labs
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button variant="primary" size="lg" asChild>
              <Link href="/courses">Start Learning →</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/labs">Explore Labs</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "100+", label: "Tutorials" },
              { value: "50+", label: "Labs" },
              { value: "10K+", label: "Learners" },
              { value: "24/7", label: "Access" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-cyber-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-cyber-text-secondary text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="w-6 h-10 border-2 border-cyber-primary rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-cyber-primary rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
