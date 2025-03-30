import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style jsx global>{`
        :root {
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        * {
          font-family: var(--font-family) !important;
        }

        body {
          font-weight: 100;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        h1, h2, h3, h4, h5, h6 {
          font-weight: 100 !important;
          letter-spacing: -0.025em;
        }

        input, select, textarea, button {
          font-family: var(--font-family) !important;
          font-weight: 100;
        }

        ::placeholder {
          font-weight: 100;
          opacity: 0.7;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 