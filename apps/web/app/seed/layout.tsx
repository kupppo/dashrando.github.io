export const metadata = {
  title: 'DASH Randomizer Seed',
  description: 'Seed generated by the Super Metroid DASH Randomizer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
