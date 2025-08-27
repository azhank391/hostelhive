import React from 'react';
import Image from 'next/image';
import { StarIcon } from 'lucide-react';
interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}
function Testimonial({
  quote,
  author,
  role,
  image
}: TestimonialProps) {
  return <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => <StarIcon key={i} size={18} className="text-[#F59E0B] fill-current" />)}
      </div>
      <p className="text-gray-700 mb-6">&quot;{quote}&quot;</p>
      <div className="flex items-center">
        <Image src={image} alt={author} width={48} height={48} className="w-12 h-12 rounded-full mr-4 object-cover" />
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-gray-600 text-sm">{role}</p>
        </div>
      </div>
    </div>;
}
export function TestimonialsSection() {
  const testimonials = [{
    quote: 'HostelHive has completely transformed how we manage our student hostels. The multi-property feature is a game-changer for us.',
    author: 'Fatima Khan',
    role: 'Hostel Owner, Lahore',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  }, {
    quote: 'The student portal has reduced our administrative work by 70%. Students love the self-service options and digital complaint system.',
    author: 'Ahmed Hassan',
    role: 'University Housing Director',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  }, {
    quote: 'As a warden, I can now manage visitor logs and room inspections digitally. HostelHive has made my job so much easier.',
    author: 'Saira Malik',
    role: 'Hostel Warden',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  }];
  return <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join 25+ hostels managing 500+ students
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => <Testimonial key={index} quote={testimonial.quote} author={testimonial.author} role={testimonial.role} image={testimonial.image} />)}
        </div>
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-8">
            Trusted by leading educational institutions
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="w-32 h-12 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-500">
                University A
              </div>
            </div>
            <div className="w-32 h-12 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-500">College B</div>
            </div>
            <div className="w-32 h-12 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-500">
                Institute C
              </div>
            </div>
            <div className="w-32 h-12 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-500">Academy D</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}