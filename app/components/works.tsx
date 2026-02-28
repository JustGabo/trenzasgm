import React from 'react'
import { client } from '@/lib/sanity'
import { urlFor } from '@/lib/image'
export default async function  Works   ()  {
//   const [works, setWorks] = useState([])
const works = await client.fetch(`*[_type == "gallery"]`)
console.log(works)
//   useEffect(() => {
//     const works = await client.fetch(`*[_type == "work"]`)
//     setWorks(works)
//   }, [])
  return (
    <section className="px-8 py-16 bg-white text-black  h-screen max-w-8xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Trabajos</h2>
        <div className="grid grid-cols-5 items-center">
            {works.map((w: { _id: string; title: string; image: string; description: string }) => (
                <div key={w._id} className="border-2 border-accent overflow-hidden rounded-lg">
                    <div className='w-full h-[40vh]'>
                        <img src={urlFor(w.image).url()} alt={w.title} className='w-full h-full object-cover' />
                    </div>
                    {/* <h3 className="text-xl font-semibold">{w.description}</h3> */}
                </div>
            ))}
        </div>
    </section>
  )
}
