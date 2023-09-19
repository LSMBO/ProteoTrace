from Maxquant import Maxquant
import pickle
import argparse
import random, string

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Maxquant result folder (txt folder)')
parser.add_argument('-f', help='Database used in the identification search')
parser.add_argument('-runID', help='Run id')
parser.add_argument('--protein-descriptions', help='Protein id', action='append')
args = parser.parse_args()

def strip_list(input_list):
    new_list = []
    for i in input_list:
        new_list.append(i[1:-2])
    return new_list

if (args.r and args.f):
    result_folder = args.r
    fasta_file = args.f
    random_suffix = ''.join(random.choices(string.digits, k=4))
    output_file_pkl = f"tmp/Maxquant_proteotrace_{random_suffix}.pkl"
    output_file_txt = f"tmp/Maxquant_proteotrace_protein_list_{random_suffix}.txt"

    maxquant = Maxquant(result_folder, fasta_file)
    with open(output_file_pkl, 'wb') as pkl_file:
        pickle.dump(maxquant, pkl_file)
        
    # Sauvegarder chaque objet Protein dans un fichier pkl
    for protein in maxquant.proteins:
        if (protein_id.startswith("CON|")):
            continue
        protein_id = protein.id.replace('|', '##')
        pkl_file = f"tmp/Maxquant_proteotrace_{random_suffix}_Protein={protein_id}.pkl"
        with open(pkl_file, 'wb') as pkl_file:
            pickle.dump(protein, pkl_file)
            
    # Sauvegarder chaque objet Peptide dans un fichier pkl
    for peptide in maxquant.peptides:
        peptide_id = peptide.id
        pkl_file = f"tmp/Maxquant_proteotrace_{random_suffix}_Peptide={peptide_id}.pkl"
        with open(pkl_file, 'wb') as pkl_file:
            pickle.dump(peptide, pkl_file)

    # Sauvegarder chaque objet ProteinGroup dans un fichier pkl
    for protein_group in maxquant.protein_groups:
        protein_group_id = protein_group.id
        pkl_file = f"tmp/Maxquant_proteotrace_{random_suffix}_ProteinGroup={protein_group_id}.pkl"
        with open(pkl_file, 'wb') as pkl_file:
            pickle.dump(protein_group, pkl_file)
    
    # Sauvegarde la liste des proteines du fasta dans un fichier tmp
    database = maxquant.sequences
    protein_description_all = [sequence["description"] for sequence in database]
    print(f"RUN_ID={random_suffix}")
    with open(output_file_txt, 'w') as output_file:
        for protein_description in protein_description_all:
            output_file.write(f"{protein_description}\n")
    
elif (args.runID):
    args.runID = args.runID[:-2]
    args.protein_descriptions = strip_list(args.protein_descriptions)
    pkl_file = f"tmp/Maxquant_proteotrace_{args.runID}.pkl"
    with open(pkl_file, 'rb') as pkl_file:
        maxquant = pickle.load(pkl_file)

    # Charger les objets Protein depuis les fichiers pkl
    loaded_proteins = []
    for protein in maxquant.proteins:
        protein_id = protein.id.replace('|', '##')
        pkl_file = f"tmp/Maxquant_proteotrace_{args.runID}_Protein={protein_id}.pkl"
        with open(pkl_file, 'rb') as pkl_file:
            loaded_protein = pickle.load(pkl_file)
        loaded_proteins.append(loaded_protein)
    
    # Charger les objets Peptide depuis les fichiers pkl
    loaded_peptides = []
    for peptide in maxquant.peptides:
        peptide_id = peptide.id
        pkl_file = f"tmp/Maxquant_proteotrace_{args.runID}_Peptide={peptide_id}.pkl"
        with open(pkl_file, 'rb') as pkl_file:
            loaded_peptide = pickle.load(pkl_file)
        loaded_peptides.append(loaded_peptide)

    # Charger les objets ProteinGroup depuis les fichiers pkl
    loaded_protein_groups = []
    for protein_group in maxquant.protein_groups:
        protein_group_id = protein_group.id
        pkl_file = f"tmp/Maxquant_proteotrace_{args.runID}_ProteinGroup={protein_group_id}.pkl"
        with open(pkl_file, 'rb') as pkl_file:
            loaded_protein_group = pickle.load(pkl_file)
        loaded_protein_groups.append(loaded_protein_group)

    for protein_description in args.protein_descriptions:
        found = False
        for loaded_protein in loaded_proteins:
            if loaded_protein.description == protein_description:
                found = True
                loaded_protein_transformed_id = loaded_protein.id.replace('|', '##')
                loaded_protein.get_sequence_coverage(f"tmp/Maxquant_proteotrace_{args.runID}_{loaded_protein_transformed_id}_coverage.txt")
                break
        if found:
            print(f"LOG={protein_description}@@IDENTIFIED=TRUE")
        else:
            print(f"LOG={protein_description}@@IDENTIFIED=FALSE")
