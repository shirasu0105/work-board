/* ============================================================
   app.jsx — ルーティング / シェル / 起動
   ============================================================ */
var ROUTE_TITLES = {
  home: ['ホーム'], inbox: ['Inbox'], tasks: ['タスク'], waiting: ['待ち'],
  projects: ['プロジェクト'], someday: ['Someday / Maybe'], memos: ['メモ'],
  journal: ['日次ジャーナル'], review: ['週次レビュー'], settings: ['設定']
};

function App() {
  var s = useStore();
  var routeSt = useState({ name: 'home', id: null }); var route = routeSt[0], setRoute = routeSt[1];
  var qa = useState(false); var quickAdd = qa[0], setQuickAdd = qa[1];

  function go(name, id) { setRoute({ name: name === 'category' ? 'category' : name, id: id || null }); document.querySelector('.main-scroll') && (document.querySelector('.main-scroll').scrollTop = 0); }

  // テーマ初期化
  useEffect(function () { document.documentElement.setAttribute('data-theme', s.settings.theme || 'dark'); }, [s.settings.theme]);

  // breadcrumb
  var crumb;
  if (route.name === 'category') { var c = s.categories.find(function (x) { return x.id === route.id; }); crumb = ['カテゴリ', c ? c.name : '']; }
  else crumb = ROUTE_TITLES[route.name] || ['ホーム'];

  function Screen() {
    switch (route.name) {
      case 'home': return <HomeScreen go={go} />;
      case 'inbox': return <InboxScreen />;
      case 'tasks': return <TasksScreen />;
      case 'waiting': return <WaitingScreen />;
      case 'projects': return <ProjectsScreen />;
      case 'someday': return <SomedayScreen />;
      case 'memos': return <MemosScreen />;
      case 'journal': return <JournalScreen />;
      case 'review': return <ReviewScreen />;
      case 'settings': return <SettingsScreen />;
      case 'category': {
        var cat = s.categories.find(function (x) { return x.id === route.id; });
        return <TasksScreen key={route.id} fixedCat={route.id} title={cat ? cat.name : 'カテゴリ'} />;
      }
      default: return <HomeScreen go={go} />;
    }
  }

  return (
    <div className="app">
      <Sidebar route={route} go={go} onQuickAdd={function () { setQuickAdd(true); }} />
      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {crumb.map(function (cpart, i) {
              return (
                <React.Fragment key={i}>
                  {i > 0 && <Icon name="chevronRight" size={13} style={{ color: 'var(--ink-tertiary)' }} />}
                  {i === crumb.length - 1
                    ? <h2>{cpart}</h2>
                    : <span className="crumb">{cpart}</span>}
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" onClick={function () { setQuickAdd(true); }}><Icon name="plus" size={14} />追加</button>
        </div>
        <div className="main-scroll">
          <Screen />
        </div>
      </div>
      {quickAdd && <QuickAddModal onClose={function () { setQuickAdd(false); }} />}
      <ToastHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
