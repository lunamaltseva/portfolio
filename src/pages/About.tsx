

export default function About() {
  const programmingSkills = ['C', 'C++', 'raylib', 'Qt', 'Python', 'NumPy', 'Pandas', 'Matplotlib', 'Seaborn', 'Scikit-Learn', 'Linux', 'Cisco IOS'];
  const designSkills = ['Blender', 'aseprite', 'Photoshop', 'Illustrator', 'InDesign', 'VEGAS Pro'];
  const writingSkills = ['Research'];

  const SkillBubble = ({ skill }: { skill: string }) => (
    <span style={{
      display: 'inline-block',
      backgroundColor: '#d1d5db',
      color: '#000000',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontFamily: 'CustomRegular, sans-serif',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
    }}>
      {skill}
    </span>
  );

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 120px)',
      padding: '3rem',
    }}>
      <div style={{ maxWidth: '40%' }}>
        <h1 style={{
          fontFamily: 'CustomTitle, sans-serif',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
          borderBottom: '2px solid #000000',
          paddingBottom: '0.5rem',
        }}>
          About Me
        </h1>

        <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'CustomRegular, sans-serif',
            fontSize: '1rem',
            color: '#000000',
            lineHeight: '1.6',
          }}>
            My name is Luna Maltseva. I grew up between the United Kingdom and the Kyrgyz Republic, and as a result speak both English and Russian fluently. At the moment, I am doing an undergrad in Software Engineering at the American University of Central Asia, specializing in Data Science. I am active in the field of Civic Engagement, I mentor others as a Peer Advisor and a Teaching Assistant, and I do research, journalism, and business coordination as a side-kick.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'CustomRegular, sans-serif',
            fontSize: '1rem',
            color: '#000000',
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            <span style={{ fontFamily: 'CustomRegularBold, sans-serif', fontWeight: 'bold' }}>Programming.</span> I have taken an interest in programming at the age of 8. Professionally, I have developed and deployed a data analysis platform for Civic Engagement grants using Python and Google Scripts. As a Teaching Assistant, I have put together course websites and designed educational projects using raylib and Qt. For personal enjoyment, I have put together a then-cutting-edge GPT 2.0 chatbot and created and distributed games.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {programmingSkills.map((skill) => (
              <SkillBubble key={skill} skill={skill} />
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'CustomRegular, sans-serif',
            fontSize: '1rem',
            color: '#000000',
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            <span style={{ fontFamily: 'CustomRegularBold, sans-serif', fontWeight: 'bold' }}>Design.</span> By 17, my graphic design skills have passed my threshold of being deemed "professional." I have been commissioned to design university resources, such as promotion materials, presentations, and branding. More often, I do graphic design for my own purposes and/or enjoyment, such as designing template course registration schedules or QR codes for study calendars.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {designSkills.map((skill) => (
              <SkillBubble key={skill} skill={skill} />
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'CustomRegular, sans-serif',
            fontSize: '1rem',
            color: '#000000',
            lineHeight: '1.6',
          }}>
            <span style={{ fontFamily: 'CustomRegularBold, sans-serif', fontWeight: 'bold' }}>Writing.</span> In my academic life, I have written essays, research papers, technical documentation, and op-eds. For self-development, I have written pop-journalism articles and am in the process of writing a novel.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {writingSkills.map((skill) => (
              <SkillBubble key={skill} skill={skill} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
