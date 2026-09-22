const fs = require('fs');
const path = require('path');

const filesToPatch = [
    { 
        file: 'src/components/DuplicateRoadbookDialog.tsx', 
        replace: [['<DialogTitle>Duplicar Road Book</DialogTitle>', '<DialogTitle>Duplicar Guia de Viagem</DialogTitle>']]
    },
    { 
        file: 'src/routes/turne.$slug.tsx', 
        replace: [['Road Book Geral da Turn', 'Guia de Viagem Geral da Turn']]
    },
    {
        file: 'src/routes/__root.tsx',
        replace: [
            ['Road Book Hub', 'Guia de Viagem Hub'],
            ['Road Book Hub', 'Guia de Viagem Hub'],
            ['Road Book Hub', 'Guia de Viagem Hub']
        ]
    },
    {
        file: 'src/routes/_authenticated/versao-motorista.$slug.tsx',
        replace: [['Road Book não encontrado', 'Guia de Viagem não encontrado']]
    },
    {
        file: 'src/routes/_authenticated/viagens.tsx',
        replace: [
            ['Os Road Books vinculados', 'Os Guias de Viagem vinculados'],
            ['ROAD BOOKS - RECENTES / FUTUROS', 'GUIAS DE VIAGEM - RECENTES / FUTUROS'],
            ['ROAD BOOKS - REALIZADOS', 'GUIAS DE VIAGEM - REALIZADOS']
        ]
    },
    {
        file: 'src/routes/_authenticated/dashboard.tsx',
        replace: [
            ['>Roadbooks<', '>Guias de Viagem<'],
            ['>Nenhum roadbook<', '>Nenhum Guia de Viagem<'],
            ['>Novo Roadbook<', '>Novo Guia de Viagem<']
        ]
    },
    {
        file: 'src/routes/turne-completa.$slug.tsx',
        replace: [
            ['>Nenhum roadbook nesta turn', '>Nenhum Guia de Viagem nesta turn']
        ]
    },
    {
        file: 'src/routes/_authenticated/malas.$evento_id.tsx',
        replace: [
            ['>Criar Roadbook<', '>Criar Guia de Viagem<']
        ]
    },
    {
        file: 'src/components/RoadbookForm.tsx',
        replace: [
            ['>Novo Roadbook<', '>Novo Guia de Viagem<'],
            ['>Salvar Roadbook<', '>Salvar Guia de Viagem<']
        ]
    }
];

filesToPatch.forEach(({ file, replace }) => {
    let content = fs.readFileSync(file, 'utf-8');
    replace.forEach(([from, to]) => {
        content = content.replace(new RegExp(from, 'g'), to);
    });
    fs.writeFileSync(file, content);
    console.log('Patched', file);
});
