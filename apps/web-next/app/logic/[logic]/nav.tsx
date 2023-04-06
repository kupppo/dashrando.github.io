import Modes from 'core/modes'
import Type from '@/app/components/typography'
import styles from './nav.module.css'

const Nav = async ({ modeKey }: { modeKey: string }) => {
  const modes:any = await Modes()
  const mode:any = modes[modeKey]
  const checks = Object.keys(mode.checks) as string[]
  return (
    <aside className={styles.wrapper}>
      <nav className={styles.nav}>
        <Type size="small" weight="bold" className={styles.title}>Logical Checks</Type>
        <ul className={styles.logical_list}>
          {checks.map((check: any) => (
            <li key={check}>
              <a href={`#${check}`}>{check}</a>
            </li>
          ))}
        </ul>
        <Type size="small" weight="bold" className={styles.title}>Item Locations</Type>
        <ul>
          {/* {checks.map((check: any) => (
            <li key={check}>
              <a href={`#${check}`}>{check}</a>
            </li>
          ))} */}
        </ul>
      </nav>
    </aside>
  )
}

export default Nav
