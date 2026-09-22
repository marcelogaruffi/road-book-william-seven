        monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
      }
    } else if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    const logoUrl = logosEspetaculos[ev.espetaculo];

    return (
      <Card key={ev.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {ev.espetaculo?.toUpperCase() || 'EVENTO'}
            </span>
          )}
          <div className={`absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform ${hasRange ? 'px-4' : 'w-14'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className={`font-black text-slate-800 dark:text-slate-100 leading-none ${hasRange ? 'text-sm' : 'text-xl'}`}>{dayStr}</span>
          </div>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1">
          <div onClick={() => { setViewMode(true); handleOpenEdit(ev); }} className="flex-1">
            <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={ev.espetaculo}>{ev.espetaculo}</h4>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={ev.cidade + (ev.local ? ' - ' + ev.local : '')}>
              📍 {ev.cidade} {ev.local ? ` - ${ev.local}` : ''}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 flex items-center gap-1.5">
              <Clock className="size-3.5" /> {ev.apresentacoes && ev.apresentacoes.length > 1 ? ev.apresentacoes.length + ' apresentações' : (ev.horario ? ev.horario.substring(0,5) : 'A definir')}
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-2" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                <Users className="size-3" /> {ev.equipe?.length || 0}
              </span>
              {ev.turne_id && (
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[120px]">
                  {getTourName(ev.turne_id)}
                </span>
              )}
            </div>
            
            {canEdit && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {permitirSms && (
                  <Button variant="ghost" size="icon" onClick={() => notifyAll(ev)} className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Notificar via SMS">
                    <Megaphone className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { setViewMode(false); handleOpenEdit(ev); }} className="h-8 w-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Editar">
                  <Edit className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );

    return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Eventos</h1>
          <p className="text-slate-500 mt-2">
            Gestão de Eventos e Espetáculos
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleOpenNew} className="rounded-xl px-6 h-12 shadow-md">
            <Plus className="mr-2 size-5" /> Adicionar Evento
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : proximos.length === 0 && realizados.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-[2rem]">
          <p className="text-slate-500 font-medium mb-6">Nenhum evento cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="space-y-12">
          {proximos.length > 0 ? (
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Próximos Eventos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {proximos.map(renderEventoCard)}
            </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white dark:bg-card/50 rounded-3xl border border-slate-100 dark:border-white/5">
              <p className="text-slate-500 font-medium">Nenhum evento futuro encontrado.</p>
            </div>
          )}
          
          {realizados.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-70">
                <h3 className="text-xl font-bold tracking-tight text-slate-500 dark:text-slate-400">Eventos Realizados</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-90">
              {realizados.map(renderEventoCard)}
            </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-2xl font-black">
                  {viewMode ? 'Informações do Evento' : (editingId ? 'Editar Evento' : 'Novo Evento')}
                </DialogTitle>
                {viewMode && canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setViewMode(false)} className="rounded-lg font-bold h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm mt-1">
                    <Edit className="size-3.5 mr-1" /> Editar
                  </Button>
                )}
              </div>
            </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Nome do Evento / Espetáculo *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleCreateEspetaculo} className="h-8 text-primary font-bold">
                  <Plus className="size-4 mr-1" /> Novo Espetáculo
                </Button>
              </div>
              <select disabled={viewMode} 
                value={espetaculo} 
                onChange={e => setEspetaculo(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Selecione um espetáculo...</option>
                {templatesEspetaculos.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

                        <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Produtora</Label>
              <Input disabled={viewMode} value={produtoraNome} onChange={e => setProdutoraNome(e.target.value)} placeholder="Nome da Produtora" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Logo da Produtora</Label>
              <div className="flex items-center gap-2">
                {produtoraLogoUrl && <img src={produtoraLogoUrl} alt="Logo" className="h-10 object-contain rounded-md border p-1 bg-white" />}
                <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-accent h-12 w-full justify-center">
                  <Plus className="size-4" /> Anexar Logo
                  <input type="file" disabled={viewMode} accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if(!file) return;
                    const { data: user } = await supabase.auth.getUser();
                    const filePath = `${user?.user?.id}/produtoras/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    await supabase.storage.from('roadbook-docs').upload(filePath, file);
                    const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
                    setProdutoraLogoUrl(data.publicUrl);
                  }} />
                </label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Vincular à Turnê (Opcional)</Label>
              <select disabled={viewMode} 
                value={turneId} 
                onChange={e => setTurneId(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Nenhuma turnê</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Cidade *</Label>
              <Input disabled={viewMode} value={cidade} onChange={e => setCidade(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Apresentações (Sessões) *</Label>
                  {!viewMode && (
                    <Button variant="outline" size="sm" onClick={() => setApresentacoesList([...apresentacoesList, { data: '', horario: '', local: local }])} className="h-8 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                      <Plus className="size-3 mr-1" /> Adicionar Sessão
                    </Button>
                  )}
                </div>
                
                {apresentacoesList.length === 0 && (
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                    Clique no botão acima para adicionar datas e locais.
                  </div>
                )}

                <div className="space-y-3">
                  {apresentacoesList.map((ap, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 relative">
                      <div className="flex-[0.8] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Data *</Label>
                        <Input type="date" disabled={viewMode} value={ap.data} onChange={e => { const nl = [...apresentacoesList]; nl[idx].data = e.target.value; setApresentacoesList(nl); if (idx === 0) setDataApres(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      <div className="flex-[0.6] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Horário *</Label>
                        <Input type="time" disabled={viewMode} value={ap.horario} onChange={e => { const nl = [...apresentacoesList]; nl[idx].horario = e.target.value; setApresentacoesList(nl); if (idx === 0) setHorario(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      <div className="flex-[1.5] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Local *</Label>
                        <Input disabled={viewMode} value={ap.local} onChange={e => { const nl = [...apresentacoesList]; nl[idx].local = e.target.value; setApresentacoesList(nl); if (idx === 0) setLocal(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      {!viewMode && apresentacoesList.length > 1 && (
                        <div className="pt-5 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => { const nl = [...apresentacoesList]; nl.splice(idx, 1); setApresentacoesList(nl); }} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Início da Viagem</Label>
              <Input disabled={viewMode} type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Fim da Viagem</Label>
              <Input disabled={viewMode} type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-12 rounded-xl" />
            </div>

            {/* EQUIPE MULTISELECT */}
            <div className="space-y-3 md:col-span-2 pt-2 border-t mt-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Equipe Escalada</Label>
              <p className="text-sm text-slate-500 -mt-2">Selecione os profissionais que terão acesso aos road books desta viagem.</p>
              
              <div className="relative">
                <div 
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => !viewMode && setShowDropdown(!showDropdown)}
                >
                  <span className="text-slate-500">Adicionar profissionais...</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`opacity-50 transition-transform ${showDropdown ? 'rotate-180' : ''}`}><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819L7.43179 8.56819C7.60753 8.74393 7.89245 8.74393 8.06819 8.56819L10.5682 6.06819C10.7439 5.89245 10.7439 5.60753 10.5682 5.43179C10.3924 5.25605 10.1075 5.25605 9.93179 5.43179L7.5 7.86358L5.06819 5.43179C4.89245 5.25605 4.60753 5.25605 4.43179 5.43179Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </div>
                
                {showDropdown && (
                  <>
                  <div className="fixed inset-0 z-[60]" onMouseDown={() => setShowDropdown(false)}></div>
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border rounded-xl shadow-xl z-[70] p-3 max-h-72 overflow-y-auto flex flex-col gap-3">
                    <Input disabled={viewMode} 
                      id="search-equipe-input"
                        placeholder="Buscar profissional..." 
                        value={searchEquipe}
                        onChange={(e) => setSearchEquipe(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    <div className="flex flex-col gap-4">
                      {[
                        { key: 'admin', label: 'Administradores', roles: ['admin'] },
                        { key: 'produtor', label: 'Produtores', roles: ['produtor'] },
                        { key: 'elenco', label: 'Elenco', roles: ['elenco'] },
                        { key: 'musico', label: 'Músicos', roles: ['musico'] },
                        { key: 'stage_manager', label: 'Stage Managers', roles: ['stage_manager'] },
                        { key: 'contra_regra', label: 'Contra-regras', roles: ['contra_regra'] },
                        { key: 'assistente_producao', label: 'Assistentes de Produção', roles: ['assistente_producao'] },
                        { key: 'camareiro', label: 'Camareiros', roles: ['camareiro'] },
                        { key: 'tour_manager', label: 'Tour Managers', roles: ['tour_manager'] },
                        { key: 'iluminador', label: 'Iluminadores', roles: ['iluminador'] },
                        { key: 'tecnico_som', label: 'Técnicos de Som', roles: ['tecnico_som'] },
                        { key: 'tecnico_video', label: 'Técnicos de Vídeo', roles: ['tecnico_video'] },
                        { key: 'roadie', label: 'Roadies', roles: ['roadie'] },
                        { key: 'cenotecnico', label: 'Cenotécnicos', roles: ['cenotecnico'] },
                        { key: 'motorista', label: 'Motoristas', roles: ['motorista'] },
                      ].map(group => {
                        const groupProfs = profissionais
                          .filter(p => {
                             const matchesRole = group.roles.includes(p.role) || (p.funcoes && p.funcoes.some((f: string) => group.roles.includes(f)));
                             const isAlreadyInThisFunction = escalasAtuais.some(e => e.usuario_id === p.id && e.funcao === group.roles[0]);
                             return matchesRole && !isAlreadyInThisFunction;
                          })
                          .filter(p => !searchEquipe || (p.nome || '').toLowerCase().includes(searchEquipe.toLowerCase()))
                          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
                          
                        if (groupProfs.length === 0) return null;
                        return (
                          <div key={group.key} className="space-y-2">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{group.label}</h4>
                            <div className="flex flex-col gap-1">
                              {groupProfs.map(p => (
                                 <div 
                                    key={p.id} 
                                    onClick={() => { toggleEquipe(p.id, group.roles[0]); setSearchEquipe(''); setTimeout(() => document.getElementById('search-equipe-input')?.focus(), 10); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                                 >
                                   <span className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                     {p.nome}
                                     <div className="flex gap-1">
                                        {(p.funcoes && p.funcoes.length > 0 ? p.funcoes : [p.role]).map((f: string, i: number) => (
                                          <Badge key={i} variant="outline" className="text-[9px] uppercase px-1 py-0 h-4 border-slate-300">
                                            {f.replace('_', ' ')}
                                          </Badge>
                                        ))}
                                     </div>
                                   </span>
                                   <Plus className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                                 </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {profissionais.filter(p => !equipe.includes(p.id)).length === 0 && (
                        <div className="text-center p-4 text-slate-500 text-sm font-medium">Todos os profissionais já foram adicionados.</div>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>

              {/* Exibição dos selecionados */}
              {escalasAtuais.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed">
                  {[...escalasAtuais]
                    .sort((a, b) => {
                       const pa = profissionais.find(x => x.id === a.usuario_id);
                       const pb = profissionais.find(x => x.id === b.usuario_id);
                       return (pa?.nome || '').localeCompare(pb?.nome || '');
                    })
                    .map(esc => {
                      const p = profissionais.find(x => x.id === esc.usuario_id);
                      if (!p) return null;
                      const cacheKey = `${esc.usuario_id}_${esc.funcao}`;
                      const escala = escalas.find(e => e.evento_id === editingId && e.usuario_id === esc.usuario_id && e.funcao === esc.funcao);
                      const statusColor = escala?.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200' :
                                          escala?.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200' :
                                          escala?.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                          'bg-slate-100 text-slate-700 border-slate-200';
                      const statusLabel = escala?.status === 'aceita' ? 'Aceita' :
                                          escala?.status === 'recusada' ? 'Recusada' :
                                          escala?.status === 'pendente' ? 'Pendente' :
                                          'Pendente';

                      return (
                        <div key={cacheKey} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-white dark:bg-card shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                              {p.nome}
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${statusColor}`}>
                                {statusLabel}
                              </Badge>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase font-bold">
                                Escalado como: {esc.funcao.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          {!viewMode && <button onClick={() => toggleEquipe(esc.usuario_id, esc.funcao)}
                             className="size-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-colors"
                          >
                             <X className="size-4" />
                            </button>}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowCachǦǦesDialog(true)} className="rounded-xl h-12 px-6 font-bold mr-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
                💰 Cachês da Equipe
              </Button>
              {viewMode ? (
                <Button onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-8 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md">
                    <Save className="size-4 mr-2"/> Salvar Evento
                  </Button>
                </>
              )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* MODAL DE CACHÊS */}
      <Dialog open={showCachesDialog} onOpenChange={setShowCachêêesDialog}>
        <DialogContent className="rounded-[2rem] p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Cachês da Equipe ({equipe.length})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {[...escalasAtuais]
              .sort((a, b) => {
                 const pa = profissionais.find(x => x.id === a.usuario_id);
                 const pb = profissionais.find(x => x.id === b.usuario_id);
                 return (pa?.nome || '').localeCompare(pb?.nome || '');
              })
              .map(esc => {
                const p = profissionais.find(x => x.id === esc.usuario_id);
                if (!p) return null;
                const cacheKey = `${esc.usuario_id}_${esc.funcao}`;
                return (
                  <div key={cacheKey} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div>
                      <p className="font-bold text-sm">{p.nome}</p>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        {esc.funcao.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">R$</span>
                      <CurrencyInput 
                        className="w-28 h-9 font-bold text-right bg-white dark:bg-slate-900"
                        value={caches[cacheKey] || ''}
                        onChange={(val) => setCaches({...caches, [cacheKey]: val})}
                      />
                    </div>
                  </div>
                );
              })}
              {escalasAtuais.length === 0 && <p className="text-slate-500 text-center text-sm py-4">Nenhum profissional selecionado.</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowCachêêesDialog(false)} className="w-full h-12 rounded-xl font-bold">Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RiderViewModal 
        open={openRiderDialog}
        onClose={setOpenRiderDialog}
        loading={loadingRider}
        eventName={currentEventName}
        somData={currentRiderSom}
        luzData={currentRiderLuz}
      />

      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="bg-indigo-600 dark:bg-indigo-900 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <MessageSquareText className="size-6" /> Notificar Equipe
              </DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium">
                Deseja enviar um SMS para avisar {smsMembersToNotify.length} pessoa(s) sobre a escala?
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Mensagem do SMS</Label>
              <Textarea disabled={viewMode} 
                value={smsMessage} 
                onChange={(e) => setSmsMessage(e.target.value)} 
                className="min-h-[100px] resize-none bg-slate-50 text-base"
              />
              <p className="text-xs text-slate-500 text-right">{smsMessage.length} caracteres</p>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-0 gap-2">
            <Button variant="outline" onClick={() => setShowSmsDialog(false)} className="rounded-xl h-12 px-6 font-bold">Pular</Button>
            <Button onClick={() => handleSendSms(smsMembersToNotify, smsMessage)} disabled={sendingSms} className="rounded-xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              {sendingSms ? <Loader2 className="size-5 animate-spin mr-2" /> : <Mic2 className="size-5 mr-2"/>} Enviar SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
