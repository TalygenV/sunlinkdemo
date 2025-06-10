import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    text: "Working with Brandon was a positive experience. He's very knowledgeable about residential solar and helped us design a system that is large enough to handle our current electric needs and ready for our future plans. Our solar system went live in January '23 and we have not had to pay anything on our electric bills. In fact, we've consistently built credits on each bill, that roll over to the next month.",
    author: "Chuck Mendez",
    rating: 5
  },
  {
    text: "Brandon called on us about 3 years ago, designed a system that fit our needs extremely well. After an unexpected heart attack, we decided it was time to downsize & was pleasantly surprised house sold to the 2nd family that the looked at it particularly because it had solar. Once in our new house we called Brandon a 2nd time for his expertise to design a system for us.",
    author: "Tom Pugh",
    rating: 5
  },
  {
    text: "Brandon took care of us every step of the way getting solar. We paid $0 down to get our system. Our electric bill is -$24 our first month having solar. We experienced our first power outage and our battery kept our home running the entire time. If you care about your family and home you need to get solar from Brandon.",
    author: "John Taylor",
    rating: 5
  }
];

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ReviewSection() {
  return (
    <div className="relative bg-black py-24 overflow-hidden -mt-1">
      {/* Background Pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-[radial-gradient-circle_at_top,_var(--tw-gradient-stops))] from-black via-neutral-900/30 to-black pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          once={true}
          viewport={{ amount: 0.3 }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUpVariant}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-8"
          >
            Customer Stories
            <span className="block mt-2 text-neutral-400">Real experiences, real results</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={review.author}
              variants={fadeInUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="h-full bg-neutral-900 rounded-2xl p-8 shadow-lg border border-neutral-800/50"
              >
                {/* Quote Icon */}
                <div className="absolute -top-4 left-6">
                  <div className="bg-black rounded-full p-2 shadow-lg border border-neutral-800">
                    <Quote className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex mb-6 mt-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-300 leading-relaxed mb-6 line-clamp-6">
                  {review.text}
                </p>

                {/* Author */}
                <div className="mt-auto">
                  <p className="font-medium text-white">{review.author}</p>
                  <p className="text-sm text-gray-400">Verified Customer</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: "500+", label: "Installations" },
            { number: "4.9", label: "Average Rating" },
            { number: "98%", label: "Satisfaction Rate" },
            { number: "$0", label: "Down Payment" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeInUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="text-center"
            >
              <motion.p
                whileHover={{ scale: 1.05 }}
                className="text-4xl font-light text-white mb-2"
              >
                {stat.number}
              </motion.p>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}